export const catalog = {
  cpu: [
    { id: 'r5600', name: 'AMD Ryzen 5 5600', spec: '6 cores · 12 threads · AM4', socket: 'AM4', ram: 'DDR4', watts: 65, price: 10500 },
    { id: 'r5700g', name: 'AMD Ryzen 7 5700G', spec: '8 cores · Radeon graphics · AM4', socket: 'AM4', ram: 'DDR4', integrated: true, watts: 65, price: 14500 },
    { id: 'r7600', name: 'AMD Ryzen 5 7600', spec: '6 cores · 12 threads · AM5', socket: 'AM5', ram: 'DDR5', watts: 65, price: 18500 },
    { id: 'i312100', name: 'Intel Core i3-12100', spec: '4 cores · UHD graphics · LGA1700', socket: 'LGA1700', ram: 'DDR4', integrated: true, watts: 60, price: 9200 },
    { id: 'i512400', name: 'Intel Core i5-12400', spec: '6 cores · 12 threads · LGA1700', socket: 'LGA1700', ram: 'DDR4', integrated: true, watts: 65, price: 13800 },
  ],
  gpu: [
    { id: 'igpu', name: 'Integrated graphics', spec: 'Uses processor graphics · no discrete card', watts: 0, price: 0 },
    { id: 'rx6600', name: 'AMD Radeon RX 6600', spec: '8 GB GDDR6 · 132 W · 210 mm', watts: 132, length: 210, price: 21500 },
    { id: 'rtx4060', name: 'NVIDIA GeForce RTX 4060', spec: '8 GB GDDR6 · 115 W · 240 mm', watts: 115, length: 240, price: 29900 },
    { id: 'rtx4070s', name: 'NVIDIA GeForce RTX 4070 Super', spec: '12 GB GDDR6X · 220 W · 285 mm', watts: 220, length: 285, price: 54900 },
  ],
  motherboard: [
    { id: 'a520', name: 'A520M DDR4 Motherboard', spec: 'AM4 · Micro-ATX · DDR4', socket: 'AM4', ram: 'DDR4', form: 'mATX', price: 6500 },
    { id: 'b550', name: 'B550M DDR4 Motherboard', spec: 'AM4 · Micro-ATX · DDR4', socket: 'AM4', ram: 'DDR4', form: 'mATX', price: 8200 },
    { id: 'b550atx', name: 'B550 ATX DDR4 Motherboard', spec: 'AM4 · ATX · DDR4', socket: 'AM4', ram: 'DDR4', form: 'ATX', price: 11200 },
    { id: 'b650', name: 'B650M DDR5 Motherboard', spec: 'AM5 · Micro-ATX · DDR5', socket: 'AM5', ram: 'DDR5', form: 'mATX', price: 13200 },
    { id: 'h610', name: 'H610M DDR4 Motherboard', spec: 'LGA1700 · Micro-ATX · DDR4', socket: 'LGA1700', ram: 'DDR4', form: 'mATX', price: 7200 },
    { id: 'h610value', name: 'H610M Value DDR4 Board', spec: 'LGA1700 · Micro-ATX · DDR4', socket: 'LGA1700', ram: 'DDR4', form: 'mATX', price: 5600 },
  ],
  ram: [
    { id: '8gb', name: '8 GB DDR4 3200', spec: 'Single-channel · 3200 MT/s', type: 'DDR4', price: 1900 },
    { id: '8gbvalue', name: '8 GB DDR4 3200 Value', spec: 'Single-channel · 3200 MT/s', type: 'DDR4', price: 1600 },
    { id: '16gb', name: '16 GB DDR4 3200', spec: '2 × 8 GB · dual-channel', type: 'DDR4', price: 3400 },
    { id: '32gb', name: '32 GB DDR4 3200', spec: '2 × 16 GB · dual-channel', type: 'DDR4', price: 6200 },
    { id: '16gb5', name: '16 GB DDR5 5600', spec: '2 × 8 GB · dual-channel', type: 'DDR5', price: 5100 },
    { id: '32gb5', name: '32 GB DDR5 5600', spec: '2 × 16 GB · dual-channel', type: 'DDR5', price: 8900 },
  ],
  storage: [
    { id: '500nvme', name: '500 GB NVMe SSD', spec: 'PCIe 3.0 · everyday storage', price: 2800 },
    { id: '480ssd', name: '480 GB SATA SSD', spec: 'SATA · entry storage', price: 2200 },
    { id: '1tnvme', name: '1 TB NVMe SSD', spec: 'PCIe 3.0 · fast project loads', price: 4700 },
    { id: '2tnvme', name: '2 TB NVMe SSD', spec: 'PCIe 3.0 · roomy workspace', price: 8200 },
  ],
  psu: [
    { id: '450psu', name: '450 W 80+ Bronze PSU', spec: 'Entry system power · 450 W', watts: 450, price: 3300 },
    { id: '400psu', name: '400 W 80+ Bronze PSU', spec: 'Entry system power · 400 W', watts: 400, price: 2700 },
    { id: '550psu', name: '550 W 80+ Bronze PSU', spec: 'Mainstream system power · 550 W', watts: 550, price: 4300 },
    { id: '650psu', name: '650 W 80+ Bronze PSU', spec: 'Upgrade headroom · 650 W', watts: 650, price: 5600 },
  ],
  case: [
    { id: 'compact', name: 'Forge Compact Air', spec: 'Micro-ATX · GPU clearance 250 mm', form: 'mATX', clearance: 250, price: 3400 },
    { id: 'compactvalue', name: 'Forge Compact Essential', spec: 'Micro-ATX · GPU clearance 230 mm', form: 'mATX', clearance: 230, price: 2600 },
    { id: 'airflow', name: 'Forge Airflow Mid-Tower', spec: 'ATX / Micro-ATX · GPU clearance 320 mm', form: 'ATX', clearance: 320, price: 5200 },
  ],
  cooling: [
    { id: 'stock', name: 'Included stock cooler', spec: 'Basic air cooling · included with CPU', price: 0 },
    { id: 'tower', name: '120 mm tower air cooler', spec: 'Enhanced airflow · low-noise focus', price: 2400 },
  ],
}

export const categoryLabels = { cpu: 'Processor', gpu: 'Graphics', motherboard: 'Motherboard', ram: 'Memory', storage: 'Storage', psu: 'Power supply', case: 'Case', cooling: 'Cooling' }
