import { CRDTDataType, RV } from "../../../Interface/WebSocket";
import { CellDataService } from "../../../Service/CellData";
import { isEmpty } from "../../../Utils";
import { logger } from "../../../Utils/Logger";

/**
 * 范围单元格刷新 - 与 单个单元格刷新的场景一致，也存在 复制粘贴 删除多个单元格 v m =null 的场景，都需要做区分
 * @param data
 * @returns
 */
export async function rv(data: string) {
	/**
	 * 范围单元格刷新
	 * 需要先取 range 范围行列数，v 的内容是根据 range 循环而来
	 */
	const { t, i, v, range } = <CRDTDataType<RV>>JSON.parse(data);
	if (t !== "rv") return logger.error("t is not rv.");
	if (isEmpty(i)) return logger.error("i is undefined.");
	if (isEmpty(range)) return logger.error("range is undefined.");
	if (isEmpty(v)) return logger.error("v is undefined.");

	logger.info("[CRDT DATA]:", data);

	// 范围添加背景颜色存储失败
	// {"t":"rv","i":"25a110fd-8e06-4318-a2d2-c42606b266ee","v":[[{"v":null,"bg":"#f19594"},{"v":null,"bg":"#f19594"}],[{"v":null,"bg":"#f19594"},{"v":null,"bg":"#f19594"}]],"range":{"row":[10,11],"column":[9,10]}}

	// {"t":"rv","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364",
	// "v":[
	// 		[{"ct":{"fa":"General","t":"g"},"v":"B","m":"B","bg":"#FFFFFF","ff":"5","fc":"#000000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false},
	// 		 {"ct":{"fa":"General","t":"n"},"v":"111","m":"111","bg":"#FFFFFF","ff":"5","fc":"#000000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false}
	// 		],
	// 		[{"ct":{"fa":"General","t":"g"},"v":"C","m":"C","bg":"#FFFFFF","ff":"5","fc":"#000000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false},
	// 		 {"ct":{"fa":"General","t":"n"},"v":"111","m":"111","bg":"#FFFFFF","ff":"5","fc":"#000000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false}
	// 		]
	// 	 ],"range":{"row":[5,6],"column":[1,2]}}
	// {"t":"rv","i":"2b62e1f2-...",
	// "v":[
	// 			[{"ct":{"fa":"General","t":"g"},"v":"B","m":"B","bg":"#FFFFFF","ff":"5","fc":"#000000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false},
	// 			 	{"ct":{"fa":"General","t":"n"},"v":"111","m":"111","bg":"#FFFFFF","ff":"5","fc":"#000000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false}
	// 			]
	// 		],
	// "range":{"row":[4,4],"column":[0,1]}}
	// 循环列，取 v 的内容，然后创建记录
	for (let k = 0; k < v.length; k++) {
		// 这里面的每一项，都是一条记录
		for (let j = 0; j < v[k].length; j++) {
			// 解析内部的 r c 值
			const item = v[k][j];
			const r = range!.row[0] + k;
			const c = range!.column[0] + j;
			// 场景一：设置空单元格的样式数据 加粗、背景、颜色、字号等
			// {"t":"rv","i":"2b62e1f2-7f7f-4889-b34d-007fe7277364","v":[[{"v":null,"bl":1},{"v":null,"bl":1}],[{"v":null,"bl":1},{"v":null,"bl":1}]],"range":{"row":[6,7],"column":[3,4]}}

			// 场景二：范围添加内容 v m 不为空
			// "v":[
			// 			[{"ct":{"fa":"General","t":"g"},"v":"B","m":"B","bg":"#FFFFFF","ff":"5","fc":"#000000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false},
			// 			 	{"ct":{"fa":"General","t":"n"},"v":"111","m":"111","bg":"#FFFFFF","ff":"5","fc":"#000000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false}
			// 			]
			// 		],
			// "range":{"row":[4,4],"column":[0,1]}}
			if ((item && item.v === null) || (item && item.v && item.m)) {
				// i r c 先判断是否存在记录，存在则更新，不存在则创建
				const exist = await CellDataService.hasCellData(i, r, c);

				// 检查 item 是否为 null 或 undefined
				const cellInfo = {
					worker_sheet_id: i,
					r,
					c,
					f: item?.f || "",
					ctfa: item?.ct?.fa,
					ctt: item?.ct?.t,
					v: <string>item?.v || "",
					m: <string>item?.m || "",
					bg: item?.bg,
					bl: <boolean>item?.bl,
					cl: <boolean>item?.cl,
					fc: item?.fc,
					ff: <string>item?.ff,
					fs: <number>item?.fs,
					ht: item?.ht,
					it: <boolean>item?.it,
					un: <boolean>item?.un,
					vt: item?.vt,
				};

				if (exist) {
					// 如果存在则更新 - 注意全量的样式数据
					await CellDataService.updateCellData({
						cell_data_id: exist.cell_data_id,
						...cellInfo,
						bg: cellInfo.bg,
						bl: <boolean>cellInfo.bl,
						cl: <boolean>cellInfo.cl,
						fc: cellInfo.fc,
						ff: <string>cellInfo.ff,
					});
				} else await CellDataService.createCellData(cellInfo);
			}

			// 复制范围单元格，有样式与删除范围单元格触发的事件参数是一样的，目前未解决BUG
			// {"t":"rv","i":"Sheet_eiro660he3z5_1740971352584",
			// 		"v":[
			// 			  [{"ct":{"fa":"General","t":"d"},"bg":"#FFFF00","ff":"5","fc":"#FF0000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false,"ps":null}],
			// 			  [{"ct":{"fa":"General","t":"d"},"bg":"#FFFF00","ff":"5","fc":"#FF0000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false,"ps":null}]
			// 			],
			// 		"range":{"row":[5,6],"column":[0,0]}
			// }
			// {"t":"rv","i":"Sheet_eiro660he3z5_1740971352584",
			// 		"v":[
			// 			  [{"ct":{"fa":"General","t":"d"},"bg":"#FFFF00","ff":"5","fc":"#FF0000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false,"ps":null}],
			// 			  [{"ct":{"fa":"General","t":"d"},"bg":"#FFFF00","ff":"5","fc":"#FF0000","bl":false,"it":false,"fs":10,"cl":false,"ht":0,"vt":0,"f":null,"un":false,"ps":null}]
			// 			],
			// 		"range":{"row":[5,6],"column":[0,0]}}
			// 场景三：删除单元格内容
			else if (item && !item.v && !item.m) {
				await CellDataService.deleteCellData(i, r, c); // 删除记录
			}
		}
	}
}
