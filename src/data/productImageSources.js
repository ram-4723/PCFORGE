// Keep image provenance beside the catalog. Local images that predate this manifest remain
// usable, but their original source could not be recovered from the repository.
export const productImageSources = Object.freeze({
  'p-psu-650': {
    kind: 'manufacturer',
    label: 'Cooler Master MWE 650 Bronze V2 product page',
    url: 'https://www.coolermaster.com/en-my/products/mwe-650-bronze-v2.html',
    assetUrl: 'https://www.coolermaster.com/on/demandware.static/-/Sites-cooler-master-main/default/dw8c77c963/Assets/mwe-650-bronze-v2/large/1_gallery_650_mwe_bronze_v2.png',
    localFile: '/images/cooler-master-mwe-650-bronze-v2.png',
  },
  'p-mat': {
    kind: 'manufacturer',
    label: 'Thermaltake Dasher Extended product page',
    url: 'https://thermaltakeusa.com/products/dasher-extended-mp-dsh-blksxs-01',
    assetUrl: 'https://thermaltakeusa.com/cdn/shop/files/Dasherextendeddemo.jpg?v=1695064323&width=1445',
    localFile: '/images/thermaltake-dasher-extended.jpg',
  },
  'p-monitor': {
    kind: 'manufacturer',
    label: 'Acer Nitro VG271U M3 product page',
    url: 'https://www.acer.com/gb-en/monitors/gaming/nitro-vg1/pdp/UM.HV1EE.304',
    assetUrl: 'https://images.acer.com/is/image/acer/VG1-VG271U-etwp-01-5',
    localFile: '/images/acer-nitro-vg271u-m3.jpg',
  },
  'p-controller': {
    kind: 'manufacturer',
    label: '8BitDo Ultimate C 2.4G product page',
    url: 'https://www.8bitdo.com/ultimate-c-2.4g-wireless-controller/',
    assetUrl: 'https://www.8bitdo.com/images/2023/ultimate-c-2.4g-wireless-controller/01-l.jpg?0508=',
    localFile: '/images/8bitdo-ultimate-c-2-4g.jpg',
  },
  'p-router': {
    kind: 'manufacturer',
    label: 'TP-Link Archer AX50 product page',
    url: 'https://www.tp-link.com/in/home-networking/wifi-router/archer-ax50/',
    assetUrl: 'https://static.tp-link.com/Archer-AX50_01_normal_1616726600988r.jpg',
    localFile: '/images/tp-link-archer-ax50.jpg',
  },
})
