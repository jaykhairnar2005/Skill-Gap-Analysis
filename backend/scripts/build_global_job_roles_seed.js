const fs = require('fs');
const path = require('path');

const DOMAIN_CATALOG = [
  { domain: 'IT & Software Development', core: ['Problem Solving', 'Git', 'Agile', 'Software Design'], roles: ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'Mobile App Developer', 'DevOps Engineer', 'Cloud Engineer', 'QA Automation Engineer', 'Site Reliability Engineer'] },
  { domain: 'Data & Analytics', core: ['SQL', 'Statistics', 'Data Visualization', 'Communication'], roles: ['Data Analyst', 'Business Intelligence Analyst', 'Data Engineer', 'Machine Learning Engineer', 'Data Scientist', 'Analytics Engineer', 'AI Research Engineer', 'Quantitative Analyst'] },
  { domain: 'Cybersecurity', core: ['Risk Assessment', 'Networking', 'Incident Response', 'Compliance'], roles: ['Security Analyst', 'Security Engineer', 'Cloud Security Engineer', 'Application Security Engineer', 'Penetration Tester', 'GRC Analyst', 'Digital Forensics Analyst', 'Security Architect'] },
  { domain: 'Product & Project Management', core: ['Stakeholder Management', 'Roadmapping', 'Planning', 'Communication'], roles: ['Product Manager', 'Technical Product Manager', 'Project Manager', 'Program Manager', 'Scrum Master', 'Business Analyst', 'Product Operations Manager', 'Delivery Manager'] },
  { domain: 'Design & Creative', core: ['Design Thinking', 'Creativity', 'Collaboration', 'Communication'], roles: ['UI Designer', 'UX Designer', 'UX Researcher', 'Product Designer', 'Graphic Designer', 'Motion Designer', '3D Artist', 'Creative Director'] },
  { domain: 'Sales', core: ['Negotiation', 'CRM', 'Communication', 'Relationship Building'], roles: ['Sales Development Representative', 'Account Executive', 'Enterprise Account Executive', 'Account Manager', 'Customer Success Manager', 'Sales Operations Analyst', 'Channel Sales Manager', 'Sales Manager'] },
  { domain: 'Marketing', core: ['Campaign Planning', 'Analytics', 'Content Strategy', 'Audience Targeting'], roles: ['Digital Marketing Specialist', 'Performance Marketing Manager', 'Content Marketing Manager', 'SEO Specialist', 'Social Media Manager', 'Brand Manager', 'Product Marketing Manager', 'Growth Marketing Manager'] },
  { domain: 'Finance & Banking', core: ['Financial Analysis', 'Regulatory Awareness', 'Risk Thinking', 'Reporting'], roles: ['Financial Analyst', 'Investment Analyst', 'Credit Analyst', 'Treasury Analyst', 'Risk Analyst', 'FP&A Manager', 'Compliance Officer', 'Internal Auditor'] },
  { domain: 'Human Resources', core: ['Communication', 'Policy Knowledge', 'Confidentiality', 'Process Management'], roles: ['HR Generalist', 'Talent Acquisition Specialist', 'Recruiter', 'HR Business Partner', 'Compensation Analyst', 'Learning and Development Specialist', 'People Operations Manager', 'CHRO'] },
  { domain: 'Healthcare', core: ['Patient Safety', 'Clinical Documentation', 'Communication', 'Ethics'], roles: ['Registered Nurse', 'Medical Doctor', 'Pharmacist', 'Physical Therapist', 'Radiology Technician', 'Healthcare Administrator', 'Clinical Research Coordinator', 'Public Health Analyst'] },
  { domain: 'Education', core: ['Curriculum Design', 'Assessment', 'Classroom Management', 'Planning'], roles: ['School Teacher', 'University Lecturer', 'Instructional Designer', 'Academic Counselor', 'Special Education Teacher', 'School Principal', 'Education Program Manager', 'EdTech Product Specialist'] },
  { domain: 'Legal', core: ['Legal Research', 'Writing', 'Regulatory Knowledge', 'Attention to Detail'], roles: ['Corporate Lawyer', 'Litigation Associate', 'Compliance Lawyer', 'Paralegal', 'Legal Operations Manager', 'Contract Specialist', 'IP Counsel', 'Legal Analyst'] },
  { domain: 'Manufacturing', core: ['Process Improvement', 'Safety', 'Quality Control', 'Documentation'], roles: ['Manufacturing Engineer', 'Production Supervisor', 'Quality Assurance Engineer', 'Industrial Engineer', 'Maintenance Engineer', 'Plant Manager', 'Supply Planner', 'Process Technician'] },
  { domain: 'Construction & Real Estate', core: ['Project Coordination', 'Safety Compliance', 'Scheduling', 'Budget Awareness'], roles: ['Civil Engineer', 'Construction Project Manager', 'Site Engineer', 'Quantity Surveyor', 'Architect', 'Real Estate Analyst', 'Property Manager', 'Urban Planner'] },
  { domain: 'Operations & Supply Chain', core: ['Planning', 'Analytics', 'Process Optimization', 'Coordination'], roles: ['Operations Manager', 'Supply Chain Analyst', 'Procurement Specialist', 'Logistics Coordinator', 'Warehouse Manager', 'Demand Planner', 'Category Manager Retail', 'Chief Operating Officer'] },
  { domain: 'Media & Communication', core: ['Storytelling', 'Audience Understanding', 'Communication', 'Content Planning'], roles: ['Journalist', 'News Producer', 'Video Producer', 'Copywriter', 'PR Specialist', 'Content Editor', 'Broadcast Engineer', 'Communications Manager'] },
  { domain: 'Hospitality & Tourism', core: ['Customer Service', 'Operations', 'Communication', 'Problem Resolution'], roles: ['Hotel Manager', 'Front Desk Supervisor', 'Travel Consultant', 'Event Manager', 'Restaurant Manager', 'Revenue Manager', 'Concierge', 'Tour Operations Manager'] },
  { domain: 'Retail & E-Commerce', core: ['Customer Focus', 'Sales Strategy', 'Inventory Awareness', 'Communication'], roles: ['Retail Store Manager', 'Merchandising Manager', 'E-Commerce Manager', 'Marketplace Specialist', 'Retail Analyst', 'Omnichannel Operations Lead', 'Customer Experience Manager', 'Category Manager'] },
  { domain: 'Energy & Utilities', core: ['Safety Standards', 'Regulatory Compliance', 'Risk Management', 'Technical Documentation'], roles: ['Electrical Engineer', 'Power Systems Engineer', 'Renewable Energy Analyst', 'Solar Project Engineer', 'Wind Turbine Technician', 'Energy Trader', 'Utilities Operations Manager', 'Sustainability Manager'] },
  { domain: 'Telecommunications', core: ['Networking', 'Troubleshooting', 'Service Reliability', 'Documentation'], roles: ['Network Engineer', 'Telecom Engineer', 'RF Engineer', 'NOC Engineer', 'Field Service Engineer', 'Telecom Project Manager', 'VoIP Engineer', 'Network Security Specialist'] },
  { domain: 'Transportation & Logistics', core: ['Route Planning', 'Operations Monitoring', 'Safety', 'Coordination'], roles: ['Logistics Manager', 'Transportation Planner', 'Fleet Manager', 'Dispatch Coordinator', 'Customs Compliance Specialist', 'Last Mile Operations Lead', 'Supply Chain Program Manager', 'Warehouse Operations Supervisor'] },
  { domain: 'Agriculture & Food', core: ['Quality Standards', 'Safety', 'Operations Planning', 'Data Tracking'], roles: ['Agronomist', 'Farm Operations Manager', 'Food Technologist', 'Quality Inspector Food', 'Supply Planner Food', 'Agricultural Data Analyst', 'Dairy Production Specialist', 'Food Safety Manager'] },
  { domain: 'Pharma & Biotechnology', core: ['Regulatory Compliance', 'Documentation', 'Quality Systems', 'Data Integrity'], roles: ['Biotech Research Scientist', 'Clinical Data Manager', 'Regulatory Affairs Specialist', 'Quality Assurance Specialist Pharma', 'Validation Engineer', 'Pharmacovigilance Analyst', 'Bioinformatics Analyst', 'Manufacturing Scientist'] },
  { domain: 'Government & Public Sector', core: ['Policy Awareness', 'Public Communication', 'Documentation', 'Regulatory Compliance'], roles: ['Policy Analyst', 'Public Administrator', 'Urban Development Officer', 'Government Data Analyst', 'Procurement Officer Public Sector', 'Public Health Program Manager', 'Emergency Management Specialist', 'Foreign Service Officer'] }
];

const SKILL_HINTS = [
  { key: /developer|engineer|sre|devops/i, skills: ['Python', 'JavaScript', 'System Design', 'Docker', 'Cloud Platforms'] },
  { key: /data|analytics|scientist|quant/i, skills: ['Python', 'SQL', 'Machine Learning', 'Pandas', 'Data Modeling'] },
  { key: /security|forensics|grc/i, skills: ['SIEM', 'Threat Modeling', 'Cloud Security', 'Vulnerability Management', 'Security Operations'] },
  { key: /manager|director|officer|chief/i, skills: ['Leadership', 'Strategic Planning', 'Stakeholder Management', 'KPI Tracking', 'Risk Management'] },
  { key: /designer|artist|creative|ux|ui/i, skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Visual Design'] },
  { key: /sales|account|success/i, skills: ['CRM', 'Negotiation', 'Pipeline Management', 'Customer Communication', 'Forecasting'] },
  { key: /marketing|seo|brand|content/i, skills: ['SEO', 'Campaign Management', 'Analytics', 'Content Strategy', 'A/B Testing'] },
  { key: /nurse|doctor|pharmacist|clinical|health/i, skills: ['Patient Care', 'Clinical Assessment', 'Medical Documentation', 'Care Coordination', 'Regulatory Compliance'] },
  { key: /lawyer|legal|paralegal|counsel/i, skills: ['Legal Research', 'Contract Drafting', 'Compliance', 'Documentation', 'Case Analysis'] },
  { key: /teacher|lecturer|education|academic|principal/i, skills: ['Curriculum Design', 'Lesson Planning', 'Assessment', 'Classroom Management', 'Mentoring'] },
  { key: /operations|supply|logistics|warehouse|procurement/i, skills: ['Process Optimization', 'Inventory Management', 'Demand Planning', 'Vendor Coordination', 'Reporting'] }
];

function skillsForRole(role, core) {
  const matched = SKILL_HINTS.filter((h) => h.key.test(role)).flatMap((h) => h.skills);
  const defaultSkills = ['Communication', 'Problem Solving', 'Collaboration'];
  return [...new Set([...(core || []), ...matched, ...defaultSkills])].slice(0, 10);
}

function experienceForRole(role) {
  if (/chief|director/i.test(role)) return 'Executive';
  if (/architect|manager|lead|officer|doctor/i.test(role)) return 'Senior';
  if (/analyst|engineer|specialist|consultant|designer/i.test(role)) return 'Mid';
  return 'Entry-Mid';
}

function salaryForRole(role, exp) {
  if (exp === 'Executive') return '$180k - $350k';
  if (/scientist|architect|security|doctor|counsel|manager/i.test(role)) return '$100k - $200k';
  if (/analyst|engineer|designer|developer|specialist/i.test(role)) return '$70k - $150k';
  return '$50k - $110k';
}

function descriptionForRole(role, domain) {
  return `Responsible for ${role.toLowerCase()} deliverables in ${domain}, ensuring quality execution and measurable outcomes.`;
}

function buildSeed() {
  return DOMAIN_CATALOG.map((d) => ({
    domain: d.domain,
    roles: d.roles.map((title) => {
      const experience_level = experienceForRole(title);
      return {
        title,
        description: descriptionForRole(title, d.domain),
        required_skills: skillsForRole(title, d.core),
        experience_level,
        salary_range: salaryForRole(title, experience_level)
      };
    })
  }));
}

function main() {
  const data = buildSeed();
  const out = path.join(__dirname, '../data/job_roles_seed.json');
  fs.writeFileSync(out, JSON.stringify(data, null, 2), 'utf8');

  const roleCount = data.reduce((sum, d) => sum + d.roles.length, 0);
  console.log(`Generated ${data.length} domains and ${roleCount} roles.`);
  console.log(`Saved: ${out}`);
}

main();
