export type TransactionFeedbackRole = 'seller' | 'buyer';

export type TransactionFeedbackEntry = {
  id: string;
  listingId: string;
  authorId: string;
  authorName: string;
  role: TransactionFeedbackRole;
  body: string;
  createdAt: string;
};
