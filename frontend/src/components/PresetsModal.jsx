import { IconWand } from './Icons.jsx'

export const PRESETS = [
  {
    id: 'cybersecurity',
    title: '🛡️ Security Advisory',
    description: 'CVE zero-day patch notice for engineering & remote workforce',
    badge: 'Security',
    outputTypes: ['advisory', 'linkedin_post', 'executive_summary'],
    parameters: {
      audience: 'Technical Team',
      tone: 'Urgent',
      language: 'English',
      detail_level: 'High',
      objective: 'Actionable Guidance',
      extra_instructions: 'Include immediate mitigation steps and explicit patching deadlines.',
    },
    sourceText: `Critical Security Advisory - CVE-2026-4481

Incident Summary:
On September 8, 2026, our threat intelligence team identified an active zero-day vulnerability in our legacy VPN Gateway software (versions 4.1.0 through 4.5.2). The vulnerability allows unauthenticated remote attackers to execute arbitrary code with root privileges.

Impacted Systems:
- Corporate VPN Gateways across EMEA and APAC regions (approx. 42 servers).
- No confirmed data exfiltration or unauthorized database access has been detected as of 14:00 UTC.

Immediate Actions Taken:
1. Emergency firewall rules deployed to restrict gateway access to whitelisted IP addresses.
2. Temporary patch v4.5.3 released and applied to 80% of affected instances.
3. SOC escalated monitoring to Level 3 alert status.

Required User Action:
All employees connecting remotely must restart their VPN client immediately and verify multi-factor authentication (MFA) prompts. IT administrators must complete patching on the remaining endpoints before September 11, 2026, 18:00 UTC.`,
  },
  {
    id: 'product_launch',
    title: '🚀 Product Launch & PR',
    description: 'Electric delivery fleet rollout announcement',
    badge: 'Marketing',
    outputTypes: ['linkedin_post', 'twitter_post', 'infographic'],
    parameters: {
      audience: 'Media / Public',
      tone: 'Professional',
      language: 'English',
      detail_level: 'Medium',
      objective: 'Brand Awareness',
      extra_instructions: 'Highlight the sustainability metrics and economic impact.',
    },
    sourceText: `NextGen Logistics Unveils Autonomous Green Delivery Fleet in Bengaluru

Bengaluru, September 2026 — NextGen Logistics today announced the commercial launch of its 100% electric, AI-assisted delivery fleet across metro cities in India. 

Key Highlights:
- Over 500 customized electric cargo vans deployed in the initial phase.
- AI route optimization reducing package transit times by 32% and cutting fleet carbon emissions by 45% compared to diesel alternatives.
- Real-time predictive tracking providing customers with 15-minute delivery windows.
- Total investment of $18 million funded through Series B round led by GreenVentures Capital.
- Projected expansion to 10 additional tier-1 and tier-2 cities by Q2 2027, creating over 1,200 local operations and maintenance jobs.`,
  },
  {
    id: 'exec_report',
    title: '📊 Executive Reliability Report',
    description: 'Quarterly cloud uptime & infrastructure metrics',
    badge: 'Executive',
    outputTypes: ['executive_summary', 'presentation', 'video_package'],
    parameters: {
      audience: 'Executives',
      tone: 'Technical',
      language: 'English',
      detail_level: 'High',
      objective: 'Decision Support',
      extra_instructions: 'Summarize root causes clearly and emphasize future reliability investments.',
    },
    sourceText: `Quarterly Incident & Reliability Report - Q2 2026

Infrastructure Performance:
Overall platform uptime was 99.94%, slightly below our 99.99% target. The shortfall was primarily caused by a 47-minute outage on July 14, resulting from a cascading failure in the distributed cache layer during peak traffic hours. 

Key Metrics:
- Total API Requests Served: 1.4 Billion (up 22% QoQ)
- Mean Time to Recovery (MTTR): 18 minutes (improved from 34 minutes in Q1)
- Customer Support Escalations: Reduced by 15% following automated self-healing rollouts.
- Infrastructure Cost per Transaction: Decreased from $0.0034 to $0.0028.

Future Initiatives:
Migration of primary storage clusters to multi-region active-active topology scheduled for Q4 2026 to eliminate single points of failure.`,
  },
]

export default function PresetsModal({ isOpen, onClose, onSelectPreset }) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon-badge">
              <IconWand className="w-5 h-5" />
            </span>
            <div>
              <h3>Sample Scenarios & Templates</h3>
              <p>Load a real-world scenario to instantly test all transformation pipelines.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="presets-grid">
          {PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="preset-card"
              onClick={() => {
                onSelectPreset(preset)
                onClose()
              }}
            >
              <div className="preset-card-top">
                <span className="preset-badge">{preset.badge}</span>
                <span className="preset-types-count">{preset.outputTypes.length} outputs</span>
              </div>
              <h4>{preset.title}</h4>
              <p className="preset-desc">{preset.description}</p>
              <div className="preset-footer">
                <span className="preset-click-hint">Click to load template →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
