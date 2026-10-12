import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-agent-fleet","title":"Agent-Fleet Orchestrator","description":"Prepare a professional advisory report for agent-fleet orchestrator using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfAgentFleet({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
