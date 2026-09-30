"use client";

/** Accessible table used as every chart's "Show as table" alternative. */
export default function DataTable({ caption, columns, rows }) {
  return (
    <div className="ms-table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table className="ms-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.key ?? i}>
              {columns.map((c, j) =>
                j === 0 ? (
                  <th key={c.key} scope="row">
                    {r[c.key]}
                  </th>
                ) : (
                  <td key={c.key}>{r[c.key]}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
