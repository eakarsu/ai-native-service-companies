import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-client-portal","title":"Client Portal Route","description":"Prepare a professional advisory report for client portal route using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapClientPortal({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
