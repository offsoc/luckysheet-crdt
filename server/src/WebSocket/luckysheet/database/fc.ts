import { CRDTDataType } from "../../../Interface/WebSocket";
import { CalcChainService } from "../../../Service/CalcChain";
import { isEmpty } from "../../../Utils";
import { logger } from "../../../Utils/Logger";

// 函数链操作 r c index func color parent children times
export async function fc(data: string) {
	// console.log("==> fc", data);
	// https://dream-num.github.io/LuckysheetDocs/zh/guide/operate.html#%E5%87%BD%E6%95%B0%E9%93%BE%E6%93%8D%E4%BD%9C
	// fc {"t":"fc","i":"4298e271-548d-4207-a826-ecececceef6f","v":"{\"r\":0,\"c\":2,\"index\":\"4298e271-548d-4207-a826-ecececceef6f\"}","op":"add","pos":0}
	//  {"t":"fc","i":"4298e271-548d-4207-a826-ecececceef6f","v":"{\"r\":6,\"c\":2,\"index\":\"4298e271-548d-4207-a826-ecececceef6f\",\"func\":[true,122,\"=A7+B7\"]}","op":"add","pos":0}
	logger.info("[CRDT DATA]:", data);
	const { t, i, v, op } = <CRDTDataType<string>>JSON.parse(data);
	if (t !== "fc") return logger.error("t is not fc.");
	if (isEmpty(i)) return logger.error("i is undefined.");

	// 请注意，此处的 v 是字符串
	const item = JSON.parse(v);
	const { r, c, index, func } = item;

	// 如果是 del 直接删除记录
	// {"t":"fc","i":"61f708fc-b159-4950-afab-176a81f4e1f6","v":null,"op":"del","pos":0}
	if (op === "del") {
		await CalcChainService.deleteCalcChain(index, r, c);
		return;
	}

	// 判断是否存在该记录
	const calcChain = await CalcChainService.findOne(index, r, c);
	// 存在则更新，不存在则创建
	if (calcChain) {
		await CalcChainService.update(calcChain.calcchain_id!, JSON.stringify(func));
	} else {
		await CalcChainService.create({
			worker_sheet_id: index,
			r,
			c,
			func: JSON.stringify(func),
		});
	}
}
