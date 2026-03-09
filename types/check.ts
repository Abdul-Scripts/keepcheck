export type CheckStatus = "pending" | "cleared";

export type CheckRecord = {
id: string;
checkNumber: string;
recipient: string;
amount: string;
issueDate: string;
memo?: string;
image?: string;
status: CheckStatus;
};