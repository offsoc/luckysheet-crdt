// 增加行或列 - 会影响 celldata r c 的值，需要更新比新增行列大/小的 r c 值

import { CRDTDataType, ARC } from "../../../Interface/WebSocket";
import { CellDataModelType } from "../../../Sequelize/Models/CellData";
import { CellDataService } from "../../../Service/CellData";
import { isEmpty } from "../../../Utils";
import { logger } from "../../../Utils/Logger";

// 撤销删除行列时，也会触发该事件，并且携带 data 字段
export async function arc(data: string) {
	logger.info("[CRDT DATA]:", data);

	const { t, i, v, rc } = <CRDTDataType<ARC>>JSON.parse(data);

	if (t !== "arc") return logger.error("t is not arc.");
	if (isEmpty(i)) return logger.error("i is undefined.");

	// 如果rc的值是r新增行，
	// 如果rc的值为c则新增列，
	// 例如rc=r，index=4，len=5， 则代表从第4行开始增加5行，

	// direction 标识添加行列的方向 lefttop 上方/左方添加 rightbottom 下方/右方添加

	// 无数据示例(一般是新增空白行列)
	// {"t":"arc","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":{"index":0,"len":1,"direction":"rightbottom","data":[]},"rc":"r"}

	// 有数据示例(一般是撤销删除行列时，会携带数据)：
	// {"t":"arc","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":{"index":3,"len":1,"direction":"lefttop","data":[[null,
	// {"ct":{"fa":"General","t":"n"},"v":"333","m":"333","bg":"#FFFFFF","ff":"5","fc":"#000000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false},
	// ... 没值部分均为 null ...,null]]},"rc":"r"}
	// {"t":"arc","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364",
	// "v":{"index":6,"len":3,"direction":"lefttop",
	// "data":[
	// 		[null,null,null,{"v":"1","ct":{"fa":"General","t":"n"},"m":"1"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
	// 		[null,null,null,{"v":"2","ct":{"fa":"General","t":"n"},"m":"2"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],
	// 		[null,null,null,{"v":"3","ct":{"fa":"General","t":"n"},"m":"3"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]]},"rc":"r"}

	// 1. 先新增行列 - 先处理 celldata r c 的关系
	await CellDataService.addCellDataRC({
		worker_sheet_id: i,
		index: v.index,
		len: v.len,
		update_type: <"r" | "c">rc,
	});

	// 2. 后处理 data - 如果是撤销的话，需要新增 celldata 记录
	if (!v.data.length) return;

	for (let k = 0; k < v.data.length; k++) {
		const item = v.data[k]; // 同时操作的可能有多列，因此这个item也是个数组，并且是 cellDataTypeItem []
		for (let j = 0; j < item.length; j++) {
			const cellItem = item[j];
			if (cellItem === null) continue;

			let r = 0;
			let c = 0;
			// 注意撤销后的 r/c 取值
			if (rc === "r") {
				r = v.index + k;
				c = j;
			} else if (rc === "c") {
				r = k;
				c = v.index + j;
			}
			// 不然 执行celldata 的插入操作
			const celldata: CellDataModelType = {
				worker_sheet_id: i,
				...cellItem,
				r,
				c, // 注意撤销后的 r/c 取值
				m: <string>cellItem.m,
				v: <string>cellItem.v,
				ctfa: <string>cellItem?.ct?.fa,
				ctt: <string>cellItem?.ct?.t,
				ps: <string>cellItem?.ps?.value,
			};
			await CellDataService.createCellData(celldata);
		}
	}
}
