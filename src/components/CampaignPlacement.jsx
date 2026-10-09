import { useState } from 'react'
import { ArrowRight, Cpu, Database, Fan, Gamepad2, MemoryStick, Monitor, Mouse, Zap } from 'lucide-react'
import { representativeImages } from '../data/products.js'
import { publicAsset } from '../utils/assets.js'

const campaignIcons = { Gpu: Monitor, Cpu, Monitor, MemoryStick, Database, Gamepad2, Mouse, Fan, Zap }

export default function CampaignPlacement({ campaign, variant = 'banner', onVisit }) {
  const [imageFailed, setImageFailed] = useState(false)
  if (campaign.campaignStatus === 'Paused') return null
  const Icon = campaignIcons[campaign.productImage] || Cpu
  const campaignImage = (campaign.image && publicAsset(campaign.image)) || representativeImages[campaign.category] || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80'
  return <a className={`campaign-placement campaign-${campaign.tint} campaign-${variant}`} href={campaign.destinationUrl || '#shop-components'} onClick={(event) => { if (onVisit) { event.preventDefault(); onVisit(campaign) } }}>
    <div className={`campaign-art ${campaignImage && !imageFailed ? 'campaign-art-has-photo' : ''}`}><div className="campaign-disc" />{campaignImage && !imageFailed ? <img className="campaign-photo" src={campaignImage} alt={`${campaign.advertiser} representative campaign image`} loading="lazy" onError={() => setImageFailed(true)} /> : <Icon size={variant === 'inline' ? 40 : 68} strokeWidth={1} />}</div>
    <div className="campaign-copy"><div className="campaign-label"><span>{campaign.campaignStatus === 'active' ? 'Sponsored' : 'Demo Advertisement'}</span><small>{campaign.offer || campaign.placementType}</small></div><p className="campaign-advertiser">{campaign.advertiser}</p><h3>{campaign.campaignTitle}</h3><p>{campaign.description}</p><span className="campaign-cta">{campaign.callToAction} <ArrowRight size={15} /></span></div>
  </a>
}
