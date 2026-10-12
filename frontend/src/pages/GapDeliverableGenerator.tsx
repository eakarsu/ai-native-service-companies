import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-deliverable-generator","title":"Deliverable Generator","description":"Prepare a professional advisory report for deliverable generator using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapDeliverableGenerator({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
