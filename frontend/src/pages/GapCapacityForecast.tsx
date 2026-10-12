import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-ai-capacity-forecast","title":"Capacity Forecast","description":"Prepare a professional advisory report for capacity forecast using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapCapacityForecast({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
