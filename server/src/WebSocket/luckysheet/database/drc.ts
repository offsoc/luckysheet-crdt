// 删除的该行，可能会引起其他的一些变化，因此，也会触发 all 事件类型
// {"t":"all","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":[],"k":"calcChain"}
// {"t":"all","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":null,"k":"filter_select"}
// {"t":"all","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":null,"k":"filter"}
// {"t":"all","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":[],"k":"luckysheet_conditionformat_save"}
// {"t":"all","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":[],"k":"luckysheet_alternateformat_save"}
// {"t":"all","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":{},"k":"dataVerification"}
// {"t":"all","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":{},"k":"hyperlink"}

import { CRDTDataType, DRC } from "../../../Interface/WebSocket";
import { CellDataService } from "../../../Service/CellData";
import { HiddenAndLenService } from "../../../Service/HiddenAndLen";
import { isEmpty } from "../../../Utils";
import { logger } from "../../../Utils/Logger";

// 删除行或列 - 会影响 celldata r c 的值，需要更新比新增行列大/小的 r c 值
export async function drc(data: string) {
	logger.info("[CRDT DATA]:", data);

	const { t, i, v, rc } = <CRDTDataType<DRC>>JSON.parse(data);

	if (t !== "drc") return logger.error("t is not drc.");
	if (isEmpty(i)) return logger.error("i is undefined.");

	// {"t":"drc","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":{"index":5,"len":1},"rc":"r"}
	// {"t":"drc","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":{"index":1,"len":5},"rc":"r"}
	// {"t":"drc","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":{"index":7,"len":3},"rc":"c"}

	// TODO: 删除该列触发的 all 事件

	// 删除行，则删除该行所有的列数据
	await CellDataService.deleteCellDataRC(i, v.index, <"r" | "c">rc);

	// 通过 index  len 来实现标记 从那里开始删除、删除多少行
	// 删除的索引 index 小的，不需要处理，只需要将 比 索引大的 记录 减小 len 即可
	await CellDataService.updateCellDataRC({
		worker_sheet_id: i,
		index: v.index,
		len: v.len,
		update_type: <"r" | "c">rc,
	});

	// 删除该列的 hide and len
	await HiddenAndLenService.deleteRC(i, v.index.toString());
}
