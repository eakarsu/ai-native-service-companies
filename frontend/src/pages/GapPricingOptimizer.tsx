import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-pricing-optimizer","title":"Pricing Optimizer","description":"Prepare a professional advisory report for pricing optimizer using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapPricingOptimizer({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
