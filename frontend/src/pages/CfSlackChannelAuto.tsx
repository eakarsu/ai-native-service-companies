import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"cf-slack-channel-auto","title":"Auto-Provisioned Client Slack","description":"Prepare a professional advisory report for auto-provisioned client slack using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function CfSlackChannelAuto({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
