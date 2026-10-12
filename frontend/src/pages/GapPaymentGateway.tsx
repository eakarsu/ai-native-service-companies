import AIWorkspace from "../components/AIWorkspace";
const feature = {"id":"gap-nonai-payment-gateway","title":"Payment Gateway Connector","description":"Prepare a professional advisory report for payment gateway connector using the brief and evidence you provide. Review the findings, assumptions, and action plan before applying changes.","samples":[]};
export default function GapPaymentGateway({ token } : { token?: string } = {}) { return <AIWorkspace feature={feature} token={token} />; }
