import type {
  AddEvidenceHashTxInput,
  DisputeRepository,
  DisputeTransactionBuilder,
  RaiseDisputeTxInput,
  ResolveDisputeSplitFundsTxInput,
  ResolveDisputeTxInput,
} from '../domain/index.js';

export interface BuildDisputeTransactionsDeps {
  transactionBuilder: DisputeTransactionBuilder;
  /** Optional so every other build* call here stays a pure delegation with
   * no persistence dependency — only `buildResolveDisputeSplitFundsTransaction`
   * uses it, to record the proposed `senderShareBps` (backend issue #40).
   * Omitting it (e.g. in tests that don't care about that side effect)
   * simply skips the recording rather than throwing. */
  disputeRepository?: DisputeRepository;
}

/** Five thin delegations to the `DisputeTransactionBuilder` port — same "no
 * branching business logic, so one file not one per call" rationale as the
 * `escrow`/`deliveries` modules' equivalent files. */
export function createBuildDisputeTransactionsUseCases(deps: BuildDisputeTransactionsDeps) {
  return {
    buildRaiseDisputeTransaction: (input: RaiseDisputeTxInput): Promise<string> =>
      deps.transactionBuilder.buildRaiseDispute(input),

    buildAddEvidenceHashTransaction: (input: AddEvidenceHashTxInput): Promise<string> =>
      deps.transactionBuilder.buildAddEvidenceHash(input),

    buildResolveDisputeRefundSenderTransaction: (input: ResolveDisputeTxInput): Promise<string> =>
      deps.transactionBuilder.buildResolveDisputeRefundSender(input),

    buildResolveDisputePayDriverTransaction: (input: ResolveDisputeTxInput): Promise<string> =>
      deps.transactionBuilder.buildResolveDisputePayDriver(input),

    buildResolveDisputeSplitFundsTransaction: async (
      input: ResolveDisputeSplitFundsTxInput,
    ): Promise<string> => {
      const xdr = await deps.transactionBuilder.buildResolveDisputeSplitFunds(input);
      await deps.disputeRepository?.recordProposedSenderShareBps(
        input.chainDeliveryId,
        input.senderShareBps,
      );
      return xdr;
    },
  };
}
