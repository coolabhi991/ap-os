const documents = [
  "Agreement.pdf",
  "BOQ.xlsx",
  "Drawing.dwg",
  "Invoice.pdf",
];

export default function DocumentList() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-bold">
        Documents
      </h2>

      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc}
            className="rounded-lg border p-3"
          >
            📄 {doc}
          </div>
        ))}
      </div>
    </div>
  );
}