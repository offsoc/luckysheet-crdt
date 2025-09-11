import { CRDTDataType, CG } from "../../../Interface/WebSocket";
import { BorderInfoModelType } from "../../../Sequelize/Models/BorderInfo";
import { HiddenAndLenModelType } from "../../../Sequelize/Models/HiddenAndLen";
import { BorderInfoService } from "../../../Service/Border";
import { HiddenAndLenService } from "../../../Service/HiddenAndLen";
import { isEmpty } from "../../../Utils";
import { logger } from "../../../Utils/Logger";

// config操作
export async function cg(data: string) {
	logger.info("[CRDT DATA]:", data);
	const { t, i, v, k } = <CRDTDataType<CG>>JSON.parse(data);

	if (t !== "cg") return logger.error("t is not cg.");
	if (isEmpty(i)) return logger.error("i is undefined.");

	// k: 操作的key值，边框：'borderInfo' / ：行隐藏：'rowhidden' / 列隐藏：'colhidden' / 行高：'rowlen' / 列宽：'columnlen'

	// 行隐藏/列隐藏 统一处理
	// { "t": "cg", "i": "Sheet_0554kKiKl4M7_1597974810804", "v": { "5": 0, "6": 0, "13": 0, "14": 0 },  "k": "rowhidden"}

	// 修改行高列宽
	// {"t":"cg","i":"e73f971d-606f-4b04-bcf1-98550940e8e3","v":{"4":100},"k":"rowlen"}

	// 取消隐藏行
	// {"t":"cg","i":"Sheet_13073il53h5h_1757404832048","v":{},"k":"colhidden"}

	if (k === "rowhidden" || k === "colhidden" || k === "rowlen" || k === "columnlen") {
		// 因为前台发送的全量数据，因此，每次执行，都需要先删除后添加
		//  {"t":"cg","i":"e73f971d-606f-4b04-bcf1-98550940e8e3","v":{"7":0,"8":0,"9":0},"k":"rowhidden"}
		//  {"t":"cg","i":"e73f971d-606f-4b04-bcf1-98550940e8e3","v":{},"k":"rowhidden"}
		await HiddenAndLenService.deleteHidden(i, k);
		for (const key in v) {
			if (Object.prototype.hasOwnProperty.call(v, key)) {
				const value = Number(v[key]);
				// 判断具体是 行还是列
				const configInfo: HiddenAndLenModelType = {
					worker_sheet_id: i,
					config_index: key,
					config_type: k,
					config_value: value,
				};

				await HiddenAndLenService.create(configInfo);
			}
		}
	}

	// 场景三: k borderInfo 边框处理
	// {"t":"cg","i":"e73f971d606...","v":[{"rangeType":"range","borderType":"border-all","color":"#000","style":"1","range":[{"row":[0,0],"column":[0,0],"row_focus":0,"column_focus":0,"left":0,"width":73,"top":0,"height":19,"left_move":0,"width_move":73,"top_move":0,"height_move":19}]}],"k":"borderInfo"}
	// {"t":"cg","i":"e73f971d......","v":[{"rangeType":"range","borderType":"border-all","color":"#000","style":"1","range":[{"row":[2,7],"column":[1,2],"row_focus":2,"column_focus":1,"left":74,"width":73,"top":40,"height":19,"left_move":74,"width_move":147,"top_move":40,"height_move":119,}]}],"k":"borderInfo"}
	// {"t":"cg","i":"e73f971d......","v":[{"rangeType":"range","borderType":"border-bottom","color":"#000","style":"1","range":[{"left":148,"width":73,"top":260,"height":19,"left_move":148,"width_move":73,"top_move":260,"height_move":19,"row":[13,13],"column":[2,2],"row_focus":13,"column_focus":2}]}],"k":"borderInfo"}

	// 20250827 新增修复BUG：边框[无] 时，刷新异常BUG 导致该BUG的原因： 传入的数据类型，并非顺序的 all none
	/**
	 * { "rangeType": "range", "borderType": "border-all", "color": "#000", "range": [{ "row": [2, 14], "column": [3, 6] }] },
	 * { "rangeType": "range", "borderType": "border-all", "color": "#000", "range": [{ "row": [8, 16], "column": [6, 8] }] },
	 * { "rangeType": "range", "borderType": "border-none", "color": "#000", "range": [{ "row": [2, 14], "column": [3, 6] }] },
	 * { "rangeType": "range", "borderType": "border-all", "color": "#000", "range": [{ "row": [2, 8], "column": [2, 4] }] },
	 * { "rangeType": "range", "borderType": "border-none", "color": "#000", "range": [{ "row": [4, 13], "column": [5, 7] }] },
	 * { "rangeType": "range", "borderType": "border-all", "color": "#000", "range": [{ "row": [4, 13], "column": [5, 7] }] },
	 * { "rangeType": "range", "borderType": "border-none", "color": "#000", "range": [{ "row": [8, 16], "column": [6, 8] }] },
	 * { "rangeType": "range", "borderType": "border-none", "color": "#000", "range": [{ "row": [2, 8], "column": [2, 4] }] },
	 * { "rangeType": "range", "borderType": "border-none", "color": "#000", "range": [{ "row": [4, 13], "column": [5, 7] }] }
	 */
	else if (k === "borderInfo") {
		// 处理 rangeType
		for (let idx = 0; idx < v.length; idx++) {
			const border = v[idx];
			const { rangeType, borderType, color, style, range } = border;

			// 用 i row column  及 borderType === 'border-none' 删除即可，需要添加 border-none 的记录
			// 如果是其他的 borderType，添加的时候，都需要先检查是否存在 border-none,如果存在，则不处理

			const info: BorderInfoModelType = {
				worker_sheet_id: i,
				rangeType,
				borderType,
				row_start: range[0].row[0],
				row_end: range[0].row[1],
				col_start: range[0].column[0],
				col_end: range[0].column[1],
			};
			const exist = await BorderInfoService.hasConfigBorder(info);
			if (exist) {
				// 更新
				await BorderInfoService.updateConfigBorder({
					config_border_id: exist.config_border_id,
					...info,
					color,
					style: Number(style),
				});
			} else {
				// 创建新的边框记录
				await BorderInfoService.createConfigBorder({
					...info,
					style: Number(style),
					color,
				});
			}
		}
	}
}
