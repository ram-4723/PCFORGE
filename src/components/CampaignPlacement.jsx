import { useState } from 'react'
import { ArrowRight, Cpu, Database, Fan, Gamepad2, MemoryStick, Monitor, Mouse, Zap } from 'lucide-react'
import { publicAsset } from '../utils/assets.js'

const campaignIcons = { Gpu: Monitor, Cpu, Monitor, MemoryStick, Database, Gamepad2, Mouse, Fan, Zap }

export default function CampaignPlacement({ campaign, variant = 'banner', onVisit }) {
  const [imageFailed, setImageFailed] = useState(false)
  if (!campaign || campaign.campaignStatus === 'Paused') return null
  const Icon = campaignIcons[campaign.productImage] || Cpu
  const campaignImage = campaign.image ? publicAsset(campaign.image) : null
  const bannerImage = campaign.bannerImage && !imageFailed ? publicAsset(campaign.bannerImage) : null
  const isSponsored = String(campaign.campaignStatus).toLowerCase() === 'active'
  const visit = (event) => { if (onVisit) { event.preventDefault(); onVisit(campaign) } }
  if (bannerImage) return <a className={`campaign-placement campaign-${campaign.tint} campaign-${variant} campaign-image-only${campaign.bannerAspect ? ` campaign-aspect-${campaign.bannerAspect}` : ''}`} href={campaign.destinationUrl || '#shop-components'} aria-label={campaign.imageLinkLabel || `Demo creative: ${campaign.campaignTitle}`} onClick={visit}>
    <span className="campaign-image-label">DEMO CREATIVE · NOT SPONSORED</span>
    <img className="campaign-full-image" src={bannerImage} alt={campaign.bannerAlt || campaign.campaignTitle} loading={variant === 'hero' ? 'eager' : 'lazy'} fetchPriority={variant === 'hero' ? 'high' : 'auto'} onError={() => setImageFailed(true)} />
  </a>
  return <a className={`campaign-placement campaign-${campaign.tint} campaign-${variant}`} href={campaign.destinationUrl || '#shop-components'} onClick={visit}>
    <div className={`campaign-art ${campaignImage && !imageFailed ? 'campaign-art-has-photo' : ''}`}><div className="campaign-disc" />{campaignImage && !imageFailed ? <img className="campaign-photo" src={campaignImage} alt={`${campaign.campaignTitle} campaign image`} loading="lazy" onError={() => setImageFailed(true)} /> : <Icon size={variant === 'inline' ? 40 : 68} strokeWidth={1} />}</div>
    <div className="campaign-copy"><div className="campaign-label"><span>{isSponsored ? 'Sponsored' : 'Preview · not sponsored'}</span>{isSponsored && campaign.offer && <small>{campaign.offer}</small>}</div>{isSponsored && campaign.advertiser && <p className="campaign-advertiser">{campaign.advertiser}</p>}<h3>{campaign.campaignTitle}</h3><p>{campaign.description}</p><span className="campaign-cta">{campaign.callToAction} <ArrowRight size={15} /></span></div>
  </a>
}
