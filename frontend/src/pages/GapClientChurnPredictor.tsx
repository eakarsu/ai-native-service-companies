import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-client-churn-predictor","title":"Client Churn Predictor","description":"Prepare a professional advisory report for client churn predictor using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapClientChurnPredictor({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
