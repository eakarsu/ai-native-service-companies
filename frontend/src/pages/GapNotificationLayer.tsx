import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-notification-layer","title":"Email / Notification Layer","description":"Prepare a professional advisory report for email / notification layer using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapNotificationLayer({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
