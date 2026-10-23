export const documents = [
  { id: 'DOC-001', title: '商业银行资本管理办法', code: '国家金融监督管理总局令 2023年第4号', agency: '国家金融监督管理总局', sourceCategory: '金监总局制度', topic: '资本监管', date: '2023-11-01', effective: '2024-01-01', status: '现行有效', type: '部门规章', sourceUrl: 'https://www.cbirc.gov.cn/cn/view/pages/ItemDetail.html?docId=1151568', summary: '构建差异化资本监管体系，明确资本计量、监督检查与信息披露要求。', tags: ['资本充足率', '风险加权资产', '信息披露'] },
  { id: 'DOC-002', title: '银行业金融机构数据治理指引', code: '银保监发〔2018〕22号', agency: '原中国银行保险监督管理委员会', sourceCategory: '金监总局制度', topic: '数据治理', date: '2018-05-21', effective: '2018-05-21', status: '现行有效', type: '规范性文件', summary: '明确数据治理架构、数据管理、数据质量控制和监管数据管理要求。', tags: ['数据质量', '监管数据', '治理架构'] },
  { id: 'DOC-003', title: '商业银行流动性风险管理办法', code: '中国银行保险监督管理委员会令 2018年第3号', agency: '原中国银行保险监督管理委员会', sourceCategory: '金监总局制度', topic: '流动性风险', date: '2018-05-23', effective: '2018-07-01', status: '现行有效', type: '部门规章', summary: '规定流动性风险管理体系、流动性风险监管指标和监督管理要求。', tags: ['LCR', 'NSFR', '流动性匹配率'] },
  { id: 'DOC-004', title: '商业银行大额风险暴露管理办法', code: '银保监会令 2018年第1号', agency: '原中国银行保险监督管理委员会', sourceCategory: '金监总局制度', topic: '信用风险', date: '2018-04-24', effective: '2018-07-01', status: '现行有效', type: '部门规章', summary: '规范商业银行大额风险暴露管理，控制客户集中度风险。', tags: ['大额风险暴露', '客户风险', '集中度'] },
  { id: 'DOC-005', title: '金融统计管理规定', code: '中国人民银行令〔2002〕第9号', agency: '中国人民银行', sourceCategory: '人民银行制度', topic: '金融统计', date: '2002-12-15', effective: '2002-12-15', status: '历史版本', type: '部门规章', summary: '规范金融统计活动和金融统计资料管理。', tags: ['金融统计', '统计口径', '报送管理'] },
  { id: 'DOC-006', title: '金融机构外汇业务数据报送规范', code: '汇发〔2025〕18号', agency: '国家外汇管理局', sourceCategory: '外管局制度', topic: '外汇管理', date: '2025-06-18', effective: '2025-08-01', status: '现行有效', type: '规范性文件', summary: '明确金融机构外汇业务数据报送范围、频率、口径和质量要求。', tags: ['外汇业务', '数据报送', '跨境资金'] },
  { id: 'DOC-007', title: '金融业数字化转型标准体系指南', code: '金融标准〔2025〕12号', agency: '全国金融标准化技术委员会', sourceCategory: '金融标准', topic: '数据治理', date: '2025-04-12', effective: '2025-04-12', status: '现行有效', type: '金融标准', summary: '建立金融机构数字化转型标准体系，覆盖数据治理、技术架构与安全管理。', tags: ['数字化转型', '标准体系', '数据治理'] },
  { id: 'DOC-008', title: '国家数据基础制度建设指引', code: '政数〔2024〕6号', agency: '国务院相关部委', sourceCategory: '政府制度', topic: '数据治理', date: '2024-02-20', effective: '2024-02-20', status: '现行有效', type: '政府文件', summary: '从数据产权、流通交易、收益分配和安全治理等方面提出基础制度要求。', tags: ['数据基础制度', '数据安全', '数据流通'] },
  { id: 'DOC-009', title: '银行业数据治理自律规范', code: '银协发〔2024〕36号', agency: '中国银行业协会', sourceCategory: '其他', topic: '数据治理', date: '2024-08-20', effective: '2024-08-20', status: '现行有效', type: '行业自律规范', summary: '围绕数据治理组织、数据标准、数据质量和数据安全提出行业自律要求。', tags: ['行业自律', '数据质量', '数据安全'] },
  { id: 'DOC-010', title: '金融数据安全技术规范', code: 'GB/T 42775-2023', agency: '国家标准化管理委员会', sourceCategory: '国家标准', topic: '数据安全', date: '2023-12-01', effective: '2024-07-01', status: '现行有效', type: '国家标准', summary: '规定金融数据分类分级、处理安全、共享使用和风险评估等技术要求。', tags: ['国家标准', '数据安全', '分类分级'] },
]

export const terms = [
  { term: '金融机构编码', en: 'Financial Institution Identifier', type: '国家标准', category: '基础数据', definition: '用于唯一标识金融机构及其分支机构的标准化编码体系。', source: '金融机构编码规范' },
  { term: '金融工具统计分类', en: 'Classification of Financial Instruments', type: '国家标准', category: '金融统计', definition: '按照金融工具的法律属性、流动性和风险特征形成的统一统计分类。', source: '金融工具统计分类及编码' },
  { term: '数据元', en: 'Data Element', type: '国家标准', category: '数据治理', definition: '由一组属性规定其定义、标识、表示和允许值的数据单元。', source: '信息技术 数据元规范' },
  { term: '监管数据', en: 'Regulatory Data', type: '行业标准', category: '数据治理', definition: '银行业金融机构按照监管要求向监管部门报送的数据。', source: '银行业金融机构数据治理指引' },
  { term: '客户统一标识', en: 'Unified Customer Identifier', type: '行业标准', category: '客户管理', definition: '在银行业务系统中用于统一识别同一客户主体的行业数据标识。', source: '银行业数据标准体系' },
  { term: '大额风险暴露', en: 'Large Exposure', type: '行业标准', category: '信用风险', definition: '商业银行对单一客户或一组关联客户超过一定比例的信用风险暴露。', source: '商业银行大额风险暴露管理办法' },
  { term: '核心一级资本充足率', en: 'CET1 Capital Adequacy Ratio', type: '监管指标', category: '资本监管', definition: '核心一级资本净额与风险加权资产之间的比率。', source: '商业银行资本管理办法' },
  { term: '流动性覆盖率', en: 'Liquidity Coverage Ratio, LCR', type: '监管指标', category: '流动性风险', definition: '合格优质流动性资产与未来30日现金净流出量的比率。', source: '商业银行流动性风险管理办法' },
  { term: '风险加权资产', en: 'Risk-weighted Assets, RWA', type: '监管指标', category: '资本监管', definition: '按照信用风险、市场风险和操作风险计量规则计算的风险资产总额。', source: '商业银行资本管理办法' },
]

export const reports = [
  { code: 'RPT-A01', name: '资本充足情况表（示例）', system: '监管报送体系 A', frequency: '季报', forms: 12, fields: 386, rules: 94, version: '2026.1', status: '已发布', updated: '2026-09-28' },
  { code: 'RPT-B01', name: '流动性风险监测表（示例）', system: '监管报送体系 B', frequency: '月报', forms: 8, fields: 214, rules: 63, version: '2026.2', status: '已发布', updated: '2026-10-08' },
  { code: 'RPT-C01', name: '金融统计基础表（示例）', system: '金融统计体系', frequency: '月报', forms: 24, fields: 672, rules: 132, version: '2026.1', status: '草稿', updated: '2026-10-11' },
  { code: 'RPT-D01', name: '客户风险监测表（示例）', system: '监管报送体系 C', frequency: '季报', forms: 16, fields: 498, rules: 87, version: '2025.3', status: '待发布', updated: '2026-10-12' },
]

export const metrics = [
  { code: 'CAP-001', name: '资本充足率', category: '资本监管', value: '>= 8%', unit: '%', formula: '资本净额 / 风险加权资产 × 100%', source: '商业银行资本管理办法', faq: 8, status: '已发布' },
  { code: 'CAP-002', name: '核心一级资本充足率', category: '资本监管', value: '>= 5%', unit: '%', formula: '核心一级资本净额 / 风险加权资产 × 100%', source: '商业银行资本管理办法', faq: 12, status: '已发布' },
  { code: 'LIQ-001', name: '流动性覆盖率', category: '流动性风险', value: '>= 100%', unit: '%', formula: '合格优质流动性资产 / 未来30日现金净流出量 × 100%', source: '商业银行流动性风险管理办法', faq: 10, status: '已发布' },
  { code: 'LIQ-002', name: '净稳定资金比例', category: '流动性风险', value: '>= 100%', unit: '%', formula: '可用的稳定资金 / 所需的稳定资金 × 100%', source: '商业银行流动性风险管理办法', faq: 7, status: '已发布' },
  { code: 'CRD-001', name: '不良贷款率', category: '信用风险', value: '监测指标', unit: '%', formula: '不良贷款余额 / 各项贷款余额 × 100%', source: '监管统计口径', faq: 15, status: '已发布' },
]

export const penalties = [
  { date: '2026-10-09', institution: '某国有大型商业银行分行', region: '上海', authority: '金融监管总局某监管局', violation: '贷款管理不到位', amount: 180, action: '罚款', status: '公开' },
  { date: '2026-10-07', institution: '某城市商业银行', region: '浙江', authority: '金融监管总局某监管局', violation: '监管数据报送不准确', amount: 95, action: '警告并罚款', status: '公开' },
  { date: '2026-09-29', institution: '某股份制商业银行分行', region: '广东', authority: '金融监管总局某监管局', violation: '授信管理不审慎', amount: 240, action: '罚款', status: '公开' },
  { date: '2026-09-24', institution: '某农村商业银行', region: '江苏', authority: '金融监管总局某监管局', violation: '关联交易管理不到位', amount: 130, action: '罚款', status: '公开' },
  { date: '2026-09-18', institution: '某外资银行分行', region: '北京', authority: '中国人民银行某分行', violation: '反洗钱客户身份识别不充分', amount: 310, action: '罚款', status: '公开' },
]

export const institutions = [
  { name: '中国工商银行股份有限公司', short: '工商银行', type: '国有大型商业银行', region: '北京', status: '正常', reports: 18, penalties: 24 },
  { name: '招商银行股份有限公司', short: '招商银行', type: '股份制商业银行', region: '广东', status: '正常', reports: 16, penalties: 17 },
  { name: '北京银行股份有限公司', short: '北京银行', type: '城市商业银行', region: '北京', status: '正常', reports: 14, penalties: 9 },
  { name: '上海农村商业银行股份有限公司', short: '沪农商行', type: '农村商业银行', region: '上海', status: '正常', reports: 13, penalties: 6 },
  { name: '汇丰银行（中国）有限公司', short: '汇丰中国', type: '外资法人银行', region: '上海', status: '正常', reports: 12, penalties: 5 },
]

export const updates = [
  { type: '制度', title: '资本监管专题新增 6 条条款释义', time: '今天 10:24', tone: 'green' },
  { type: '报表', title: '监管报送体系 B 更新 2026.2 版本', time: '昨天 16:40', tone: 'blue' },
  { type: '指标', title: '流动性覆盖率新增 2 条指标释疑', time: '10月12日', tone: 'amber' },
  { type: '处罚', title: '新增公开处罚案例 38 条', time: '10月11日', tone: 'red' },
]

export const penaltyTrend = [
  { month: '5月', cases: 138, amount: 6200 },
  { month: '6月', cases: 152, amount: 7450 },
  { month: '7月', cases: 144, amount: 6880 },
  { month: '8月', cases: 176, amount: 9320 },
  { month: '9月', cases: 169, amount: 8640 },
  { month: '10月', cases: 104, amount: 5210 },
]

export const qualityIssues = [
  { type: '跨表一致性', count: 86, change: '+12%', severity: '高' },
  { type: '字段口径偏差', count: 64, change: '-5%', severity: '高' },
  { type: '必填项缺失', count: 48, change: '+3%', severity: '中' },
  { type: '维度成员错误', count: 37, change: '-8%', severity: '中' },
  { type: '跨期异常波动', count: 29, change: '+6%', severity: '低' },
]

export const adminTasks = [
  { title: '商业银行资本管理办法条款解析', type: '文档解析', status: '处理中', progress: 72, owner: '管理员', time: '10分钟前' },
  { title: '监管报送体系 B 2026.2', type: '报表版本', status: '待发布', progress: 100, owner: '管理员', time: '1小时前' },
  { title: '资本充足率指标释疑补充', type: '指标维护', status: '草稿', progress: 45, owner: '管理员', time: '昨天' },
  { title: '9月处罚数据批量导入', type: '数据导入', status: '已完成', progress: 100, owner: '管理员', time: '2天前' },
]

export const searchGroups = [
  { type: '制度文档', count: 3284 },
  { type: '制度条款', count: 18642 },
  { type: '监管报表', count: 168 },
  { type: '字段与规则', count: 12860 },
  { type: '监管指标', count: 426 },
  { type: '处罚案例', count: 26090 },
]
