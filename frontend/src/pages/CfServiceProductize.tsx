import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-service-productize","title":"Service Productization","description":"Prepare a professional advisory report for service productization using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfServiceProductize({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
