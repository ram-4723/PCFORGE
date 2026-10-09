export function checkCompatibility(build) {
  const issues = []
  const { cpu, motherboard, ram, psu, gpu, case: pcCase } = build || {}
  if (cpu && motherboard && cpu.socket !== motherboard.socket) issues.push({ status: 'Needs Attention', text: `${cpu.name} uses ${cpu.socket}; the selected board uses ${motherboard.socket}. Choose a matching socket.` })
  if (motherboard && ram && motherboard.ram !== ram.type) issues.push({ status: 'Needs Attention', text: `${motherboard.name} supports ${motherboard.ram}; selected memory is ${ram.type}. Choose ${motherboard.ram} memory or a board that supports ${ram.type}.` })
  if (psu && cpu && gpu && psu.watts < cpu.watts + gpu.watts + 120) issues.push({ status: 'Needs Attention', text: `${psu.watts} W PSU leaves limited headroom for the estimated ${cpu.watts + gpu.watts + 120} W system load. Choose a higher-wattage PSU.` })
  if (motherboard && pcCase && motherboard.form !== 'mATX' && pcCase.form !== 'ATX') issues.push({ status: 'Needs Attention', text: `${motherboard.form} motherboard may not fit the selected ${pcCase.form} case. Choose an ATX case or Micro-ATX board.` })
  if (gpu?.length && pcCase?.clearance && gpu.length > pcCase.clearance) issues.push({ status: 'Needs Attention', text: `${gpu.name} is ${gpu.length} mm long; this case lists ${pcCase.clearance} mm GPU clearance. Choose the larger Airflow case.` })
  if (!cpu || !motherboard || !ram || !psu || !pcCase || !gpu) issues.push({ status: 'Needs Verification', text: 'Some fit or power information is missing. Confirm the final parts before purchase.' })
  if (!issues.length) issues.push({ status: 'Looks Compatible', text: 'The sample data shows matching CPU socket, memory type, case fit, and estimated power headroom.' })
  return issues
}
