import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-deliverable-storage","title":"Deliverable File Storage","description":"Prepare a professional advisory report for deliverable file storage using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapDeliverableStorage({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
