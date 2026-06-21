import { Score } from "../models/Score";
import { calculateTotal } from "../utils/businessLogic";

interface SaveScoreInput {
  participantId: string;
  committeeId: string;
  criterionId: string;
  judgeUserId: string;
  indicatorScores: { indicatorId: string; value: number }[];
}

/**
 * يقابل saveScore في ScoresContext.tsx تمامًا:
 * يبحث عن سجل موجود بنفس (participantId+committeeId+criterionId+judgeUserId) فيحدّثه،
 * وإلا يُنشئ سجلًا جديدًا. يُمنع التحديث إن كانت الدرجة معتمدة بالفعل.
 */
export async function saveScoreShared(input: SaveScoreInput) {
  const total = calculateTotal(input.indicatorScores as any);

  const existing = await Score.findOne({
    participantId: input.participantId,
    committeeId: input.committeeId,
    criterionId: input.criterionId,
    judgeUserId: input.judgeUserId,
  });

  if (existing) {
    if (existing.approved) {
      return { error: "هذه الدرجة معتمدة بالفعل — لا يمكن تعديلها", status: 403 } as const;
    }
    existing.indicatorScores = input.indicatorScores as any;
    existing.total = total;
    await existing.save();
    return { score: existing } as const;
  }

  const score = await Score.create({
    ...input,
    total,
    approved: false,
  });
  return { score } as const;
}

export async function approveScoreShared(scoreId: string) {
  return Score.findByIdAndUpdate(scoreId, { approved: true }, { new: true });
}

export async function approveManyShared(scoreIds: string[]) {
  return Score.updateMany({ _id: { $in: scoreIds } }, { $set: { approved: true } });
}