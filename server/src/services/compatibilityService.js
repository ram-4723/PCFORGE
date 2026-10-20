import { normalizeCategory } from '../models/component.js'

export const DEFAULT_PSU_SAFETY_MARGIN = 1.25
export const DEFAULT_PLATFORM_ALLOWANCE_W = 100

function componentsByCategory(components) {
  return Object.fromEntries((components || []).map((component) => [
    normalizeCategory(component.category), component,
  ]))
}

function spec(component, key) {
  return component?.specifications?.[key] || {}
}

function addMissing(unverified, code, message) {
  unverified.push({ code, message })
}

export function checkCompatibility(components, {
  psuSafetyMargin = DEFAULT_PSU_SAFETY_MARGIN,
  platformAllowanceW = DEFAULT_PLATFORM_ALLOWANCE_W,
} = {}) {
  const parts = componentsByCategory(components)
  const errors = []
  const warnings = []
  const unverified = []
  const cpu = parts.CPU
  const motherboard = parts.Motherboard
  const ram = parts.RAM
  const gpu = parts.GPU
  const pcCase = parts.Case
  const psu = parts.PSU
  const cooler = parts['CPU Cooler']
  const storage = parts.Storage

  for (const category of ['CPU', 'Motherboard', 'RAM', 'PSU', 'Case']) {
    if (!parts[category]) addMissing(unverified, `MISSING_${category.toUpperCase().replace(/\W+/g, '_')}`, `${category} has not been selected.`)
  }

  if (cpu && motherboard) {
    const cpuSocket = spec(cpu, 'cpu').socket
    const boardSocket = spec(motherboard, 'motherboard').socket
    if (cpuSocket && boardSocket && cpuSocket !== boardSocket) {
      errors.push({ code: 'CPU_SOCKET_MISMATCH', message: `${cpu.name} uses ${cpuSocket}; ${motherboard.name} uses ${boardSocket}.` })
    } else if (!cpuSocket || !boardSocket) {
      addMissing(unverified, 'CPU_SOCKET_UNVERIFIED', 'CPU and motherboard socket compatibility cannot be confirmed from the saved specifications.')
    }

    const supportedModels = spec(motherboard, 'motherboard').supportedCpuModels
    if (Array.isArray(supportedModels) && supportedModels.length) {
      if (!supportedModels.some((model) => model.toLowerCase() === cpu.model?.toLowerCase())) {
        errors.push({ code: 'CPU_SUPPORT_UNLISTED', message: `${cpu.model} is not listed in this motherboard’s supported CPU data.` })
      }
    } else {
      addMissing(unverified, 'CPU_SUPPORT_DATA_MISSING', 'Motherboard CPU support or BIOS revision data is not documented.')
    }
  }

  if (motherboard && ram) {
    const boardSpec = spec(motherboard, 'motherboard')
    const ramType = spec(ram, 'ram').memoryType
    const boardTypes = boardSpec.supportedMemoryTypes || (boardSpec.memoryType ? [boardSpec.memoryType] : [])
    if (ramType && boardTypes.length && !boardTypes.includes(ramType)) {
      errors.push({ code: 'RAM_GENERATION_MISMATCH', message: `${motherboard.name} supports ${boardTypes.join(' or ')}; ${ram.name} is ${ramType}.` })
    } else if (!ramType || !boardTypes.length) {
      addMissing(unverified, 'RAM_GENERATION_UNVERIFIED', 'Memory generation compatibility is not fully documented.')
    }
    const ramSpec = spec(ram, 'ram')
    if (boardSpec.maxMemoryGb && ramSpec.capacityGb && ramSpec.capacityGb > boardSpec.maxMemoryGb) {
      errors.push({ code: 'RAM_CAPACITY_EXCEEDED', message: `${ram.name} exceeds the motherboard’s documented ${boardSpec.maxMemoryGb} GB memory limit.` })
    } else if (!boardSpec.maxMemoryGb || !ramSpec.capacityGb) {
      addMissing(unverified, 'RAM_CAPACITY_UNVERIFIED', 'Maximum memory capacity could not be checked.')
    }
    if (boardSpec.memorySlots && ramSpec.moduleCount && ramSpec.moduleCount > boardSpec.memorySlots) {
      errors.push({ code: 'RAM_MODULE_COUNT_EXCEEDED', message: `${ram.name} uses ${ramSpec.moduleCount} modules but the motherboard documents ${boardSpec.memorySlots} slots.` })
    } else if (!boardSpec.memorySlots || !ramSpec.moduleCount) {
      addMissing(unverified, 'RAM_MODULE_COUNT_UNVERIFIED', 'Memory module configuration could not be checked against motherboard slots.')
    }
  }

  if (motherboard && pcCase) {
    const formFactor = spec(motherboard, 'motherboard').formFactor
    const supported = spec(pcCase, 'pcCase').motherboardFormFactors
    if (formFactor && Array.isArray(supported) && supported.length && !supported.includes(formFactor)) {
      errors.push({ code: 'CASE_FORM_FACTOR_MISMATCH', message: `${pcCase.name} does not list support for the ${formFactor} motherboard form factor.` })
    } else if (!formFactor || !Array.isArray(supported) || !supported.length) {
      addMissing(unverified, 'CASE_FORM_FACTOR_UNVERIFIED', 'Case and motherboard form-factor fit is not fully documented.')
    }
  }

  if (gpu && pcCase) {
    const length = spec(gpu, 'gpu').lengthMm
    const clearance = spec(pcCase, 'pcCase').maxGpuLengthMm
    if (length && clearance && length > clearance) {
      errors.push({ code: 'GPU_CLEARANCE_EXCEEDED', message: `${gpu.name} is ${length} mm long; ${pcCase.name} documents ${clearance} mm GPU clearance.` })
    } else if (!length || !clearance) {
      addMissing(unverified, 'GPU_CLEARANCE_UNVERIFIED', 'GPU length or case clearance is not documented.')
    }
  }

  if (cooler && cpu) {
    const sockets = spec(cooler, 'cooler').supportedSockets
    const socket = spec(cpu, 'cpu').socket
    if (Array.isArray(sockets) && sockets.length && socket && !sockets.includes(socket)) {
      errors.push({ code: 'COOLER_SOCKET_MISMATCH', message: `${cooler.name} does not list support for the CPU’s ${socket} socket.` })
    } else if (!Array.isArray(sockets) || !sockets.length || !socket) {
      addMissing(unverified, 'COOLER_SOCKET_UNVERIFIED', 'CPU cooler socket support is not fully documented.')
    }
    const coolerHeight = spec(cooler, 'cooler').heightMm
    const maxHeight = spec(pcCase, 'pcCase').maxCpuCoolerHeightMm
    if (pcCase && coolerHeight && maxHeight && coolerHeight > maxHeight) {
      errors.push({ code: 'COOLER_CLEARANCE_EXCEEDED', message: `${cooler.name} is ${coolerHeight} mm tall; ${pcCase.name} documents ${maxHeight} mm cooler clearance.` })
    } else if (pcCase && (!coolerHeight || !maxHeight)) {
      addMissing(unverified, 'COOLER_CLEARANCE_UNVERIFIED', 'CPU cooler or case height clearance is not documented.')
    }
  }

  if (psu) {
    const psuSpec = spec(psu, 'psu')
    const cpuPower = spec(cpu, 'cpu').tdpW
    const gpuPower = spec(gpu, 'gpu').powerDrawW
    if (cpu && gpu && cpuPower !== undefined && gpuPower !== undefined && psuSpec.wattageW) {
      const required = Math.ceil((cpuPower + gpuPower + platformAllowanceW) * psuSafetyMargin)
      if (psuSpec.wattageW < required) {
        errors.push({ code: 'PSU_WATTAGE_INSUFFICIENT', message: `${psu.name} provides ${psuSpec.wattageW} W; documented part power plus ${platformAllowanceW} W platform allowance and ${Math.round((psuSafetyMargin - 1) * 100)}% headroom require about ${required} W.` })
      } else {
        warnings.push({ code: 'PSU_ESTIMATE', message: `PSU headroom is estimated from documented CPU/GPU power and a configurable safety margin; verify the final system power requirements.` })
      }
    } else if (cpu || gpu) {
      addMissing(unverified, 'PSU_WATTAGE_UNVERIFIED', 'PSU wattage adequacy cannot be checked because component power specifications are incomplete.')
    }

    const requiredConnectors = [
      ...spec(cpu, 'cpu').powerConnectors || [],
      ...spec(gpu, 'gpu').powerConnectors || [],
    ]
    if (requiredConnectors.length && Array.isArray(psuSpec.connectors)) {
      const missing = requiredConnectors.filter((connector) => !psuSpec.connectors.includes(connector))
      if (missing.length) errors.push({ code: 'PSU_CONNECTOR_MISSING', message: `${psu.name} does not document required connector(s): ${missing.join(', ')}.` })
    } else if ((cpu || gpu) && (!requiredConnectors.length || !Array.isArray(psuSpec.connectors))) {
      addMissing(unverified, 'PSU_CONNECTORS_UNVERIFIED', 'Power connector requirements are not fully documented.')
    }
  }

  if (storage && motherboard) {
    const drive = spec(storage, 'storage')
    const board = spec(motherboard, 'motherboard')
    if (drive.interface && Array.isArray(board.storageInterfaces) && board.storageInterfaces.length && !board.storageInterfaces.includes(drive.interface)) {
      errors.push({ code: 'STORAGE_INTERFACE_UNSUPPORTED', message: `${motherboard.name} does not list support for the ${drive.interface} interface used by ${storage.name}.` })
    } else if (!drive.interface || !Array.isArray(board.storageInterfaces) || !board.storageInterfaces.length) {
      addMissing(unverified, 'STORAGE_INTERFACE_UNVERIFIED', 'Storage interface support is not documented for both components.')
    }
    if (drive.formFactor && Array.isArray(board.storageFormFactors) && board.storageFormFactors.length && !board.storageFormFactors.includes(drive.formFactor)) {
      errors.push({ code: 'STORAGE_FORM_FACTOR_UNSUPPORTED', message: `${motherboard.name} does not list support for the ${drive.formFactor} form factor used by ${storage.name}.` })
    }
  }

  const status = errors.length ? 'incompatible' : unverified.length ? 'unverified' : 'compatible'
  return { status, compatible: status === 'compatible', errors, warnings, unverified }
}
