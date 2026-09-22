#!/usr/bin/env python3
"""记录一次访问量快照到 stats/visits.json

用法: python3 scripts/record-visit-snapshot.py <vercount 读到的原始 site_pv>

vercount 的读取接口每调用一次就会让计数 +1（探针自增），所以这里把"探针累计次数"
记进 probes，点里存的 pv 是扣掉探针后的真实累计值 —— 这样两次快照相减就是真实新增。
"""
import datetime
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH = os.path.join(ROOT, 'stats', 'visits.json')


def main():
    if len(sys.argv) < 2:
        print('用法: record-visit-snapshot.py <原始 site_pv>', file=sys.stderr)
        return 2
    raw = int(sys.argv[1])
    today = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d')

    data = {'updated': today, 'probes': 0, 'points': []}
    if os.path.exists(PATH):
        with open(PATH, encoding='utf-8') as f:
            data = json.load(f)

    probes = int(data.get('probes', 0)) + 1
    points = [p for p in data.get('points', []) if p.get('d') != today]
    points.append({'d': today, 'pv': raw - probes})
    points.sort(key=lambda p: p['d'])

    data['probes'] = probes
    data['points'] = points
    data['updated'] = today

    os.makedirs(os.path.dirname(PATH), exist_ok=True)
    with open(PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')

    print('原始 %d - 探针 %d = %d' % (raw, probes, raw - probes))
    with open(PATH, encoding='utf-8') as f:
        print(f.read())
    return 0


if __name__ == '__main__':
    sys.exit(main())
