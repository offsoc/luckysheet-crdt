import { CRDTDataType } from "../../../Interface/WebSocket";
import { WorkerBookService } from "../../../Service/WorkerBook";
import { logger } from "../../../Utils/Logger";

// 修改工作簿名称
export async function na(data: string, gridKey: string) {
	// {"t":"na","i":null,"v":"Luckysheet Demo222"}
	logger.info("[CRDT DATA]:", data);
	const { t, v } = <CRDTDataType<string>>JSON.parse(data);
	if (t !== "na") return logger.error("t is not na.");

	// 更新 workerBook name 属性即可 gridkey 在用户身上
	await WorkerBookService.update({ title: v, gridKey });
}
