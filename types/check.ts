export type CheckRecord = {
  id: string;
  checkNumber: string;
  recipient: string;
  amount: string;
  issueDate: string;
  memo?: string;
  image?: string;
};