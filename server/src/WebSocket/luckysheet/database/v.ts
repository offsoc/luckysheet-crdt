import { isEmpty } from "../../../Utils";
import { logger } from "../../../Utils/Logger";
import { CellDataService } from "../../../Service/CellData";
import { CRDTDataType, V } from "../../../Interface/WebSocket";
import { CellDataModelType } from "../../../Sequelize/Models/CellData";

// 单个单元格刷新
export async function v(data: string) {
	// 1. 解析 rc 单元格
	const { t, r, c, v, i } = <CRDTDataType<V>>JSON.parse(data);
	logger.info("[CRDT DATA]:", data);

	// 纠错判断
	if (t !== "v") return logger.error("t is not v.");
	if (isEmpty(i)) return logger.error("i is undefined.");
	if (isEmpty(r) || isEmpty(c)) return logger.error("r or c is undefined.");

	// 场景一 输入内容存在换行符，则内容是通过 s 传输
	// {"t":"v","i":"28a60885-46e3-4f59-9d25-442a30fdbba6","v":{"ct":{"fa":"General","t":"inlineStr","s":[{"ff":"Times New Roman","fc":"#000000","fs":10,"cl":0,"un":0,"bl":0,"it":0,"v":"123\r\nhhh"}]}},"r":7,"c":0}
	// {"t":"v","i":"28a60885-46e3-4f59-9d25-442a30fdbba6","v":{"ct":{"fa":"General","t":"inlineStr","s":[{"ff":"Times New Roman","fc":"#000000","fs":10,"cl":0,"un":0,"bl":0,"it":0,"v":"jasdjkasdh\r\n换行"}]}},"r":14,"c":1}
	if (v && !v.v && v.ct && v.ct.s && v.ct.s.length > 0) {
		// 取 v m
		const ctfa = v.ct.fa;
		const ctt = v.ct.t;
		const cts = JSON.stringify(v.ct.s);

		// 判断表内是否存在当前记录
		const exist = await CellDataService.hasCellData(i, r, c);

		const info: CellDataModelType = {
			worker_sheet_id: i,
			r,
			c,
			ctfa,
			ctt,
			cts,
			v: "",
			m: "",
			bg: v.bg,
			bl: <boolean>v.bl,
			cl: <boolean>v.cl,
			fc: v.fc,
			ff: <string>v.ff,
			fs: <number>v.fs,
			ht: v.ht,
			it: <boolean>v.it,
			un: <boolean>v.un,
			vt: v.vt,
			tb: <number>v.tb,
			ps: <string>v?.ps?.value,
		};

		// 如果存在则更新
		if (exist) {
			await CellDataService.updateCellData({
				cell_data_id: exist.cell_data_id,
				...info,
			});
		} else {
			// 创建新的记录时，当前记录的 cell_data_id 由 sequelize 自动创建
			await CellDataService.createCellData(info);
		}
	}

	// 场景一：单个单元格插入值（包括格式刷）
	// {"t":"v","i":"e73f971d-606f-4b04-bcf1-98550940e8e3","v":{"v":"123","ct":{"fa":"General","t":"n"},"m":"123"},"r":5,"c":0}
	else if (v && v.v && v.m) {
		// 取 v m
		const value = <string>v.v;
		const monitor = <string>v.m;

		// 处理 ct 字段可能缺失的情况（格式刷时常见）
		const ctfa = v.ct?.fa || "General";
		const ctt = v.ct?.t || "n";

		// 判断表内是否存在当前记录
		const exist = await CellDataService.hasCellData(i, r, c);

		const info: CellDataModelType = {
			worker_sheet_id: i,
			r,
			c,
			f: v.f,
			v: value,
			m: monitor,
			ctfa,
			ctt,
			bg: v.bg,
			bl: <boolean>v.bl,
			cl: <boolean>v.cl,
			fc: v.fc,
			ff: <string>v.ff,
			fs: <number>v.fs,
			ht: v.ht,
			it: <boolean>v.it,
			un: <boolean>v.un,
			vt: v.vt,
			tb: <number>v.tb,
			ps: <string>v?.ps?.value,
		};

		// 如果存在则更新
		if (exist) {
			await CellDataService.updateCellData({
				cell_data_id: exist.cell_data_id,
				...info,
			});
		} else {
			// 创建新的记录时，当前记录的 cell_data_id 由 sequelize 自动创建
			await CellDataService.createCellData(info);
		}
	}

	// 场景二：设置空单元格的样式数据 加粗、背景、颜色、字号等
	// {"t":"v","i":"e73f971d-606f-4b04-bcf1-98550940e8e3","v":{"v":null,"bg":"#ff0000"},"r":3,"c":2}
	else if (v && v.v === null) {
		// 判断 i r c 是否存在
		const exist = await CellDataService.hasCellData(i, r, c);

		const info: CellDataModelType = {
			worker_sheet_id: i,
			r,
			c,
			v: "",
			m: "",
			f: v.f || "",
			bg: v.bg,
			bl: <boolean>v.bl,
			cl: <boolean>v.cl,
			fc: v.fc,
			ff: <string>v.ff,
			fs: <number>v.fs,
			ht: v.ht,
			it: <boolean>v.it,
			un: <boolean>v.un,
			tb: <number>v.tb,
			vt: v.vt,
		};

		if (exist) {
			// 如果存在则更新 - 注意全量的样式数据
			await CellDataService.updateCellData({
				cell_data_id: exist.cell_data_id,
				...info,
			});
		} else await CellDataService.createCellData(info);
	}

	// 场景三：剪切/粘贴到某个单元格 - 会触发两次广播（一次是删除，一次是创建）
	// {"t":"v","i":"e73f971d-606f-4b04-bcf1-98550940e8e3","v":null,"r":9,"c":0}
	// {"t":"v","i":"e73f971d-606f-4b04-bcf1-98550940e8e3","v":{"ct":{"fa":"General","t":"n"},"v":"123","m":"123"},"r":13,"c":0}
	else if (v === null) {
		await CellDataService.deleteCellData(i, r, c);
	}

	// 场景五：公式链操作时，会直接生成数值
	// {"t":"v","i":"61f708fc-b159-4950-afab-176a81f4e1f6","v":6,"r":0,"c":2}
	else if (v && typeof v === "number") {
		// console.log(" ==> 监听到了");
		// 更新 r c 的value 值
		const cell = await CellDataService.hasCellData(i, r, c);
		await CellDataService.updateCellData({
			cell_data_id: cell?.cell_data_id,
			worker_sheet_id: i,
			r,
			c,
			v: v,
			m: v,
		});
	}

	// 场景六：单元格图片上设置
	// {"t":"v","i":"3fc7f0b8-8fda-4e12-8a51-f2bad072b9c5","v":{"f":"=DISPIMG('img_onb00NooTrk6_1757387493023',1)"},"r":5,"c":3}
	else if (v && v.f && v.f.startsWith("=DISPIMG(")) {
		// 更新 r c 的f 值

		// 处理 ct 字段可能缺失的情况（格式刷时常见）
		const ctfa = v.ct?.fa || "General";
		const ctt = v.ct?.t || "n";

		// 判断表内是否存在当前记录
		const exist = await CellDataService.hasCellData(i, r, c);

		const info: CellDataModelType = {
			worker_sheet_id: i,
			r,
			c,
			f: v.f,
			v: "",
			m: "",
			ctfa,
			ctt,
		};

		// 如果存在则更新
		if (exist) {
			await CellDataService.updateCellData({
				cell_data_id: exist.cell_data_id,
				...info,
			});
		} else {
			// 创建新的记录时，当前记录的 cell_data_id 由 sequelize 自动创建
			await CellDataService.createCellData(info);
		}
	}

	// 场景四： 删除单元格内容
	// {"t":"v","i":"e73f971d-606f-4b04-bcf1-98550940e8e3","v":{"ct":{"fa":"General","t":"n"}},"r":5,"c":0}
	else if (v && typeof v === "object" && !v.v && !v.m) {
		await CellDataService.deleteCellData(i, r, c); // 删除记录
	}
}
