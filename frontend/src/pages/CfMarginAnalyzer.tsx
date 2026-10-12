import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-margin-analyzer","title":"Per-Task Margin Analyzer","description":"Prepare a professional advisory report for per-task margin analyzer using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfMarginAnalyzer({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
