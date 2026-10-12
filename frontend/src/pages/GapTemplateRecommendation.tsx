import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-template-recommendation","title":"Template Recommendation","description":"Prepare a professional advisory report for template recommendation using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapTemplateRecommendation({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
