interface Props {
  companyName: string;
  clientCode: string;
  contactPerson: string;
  mobile: string;
  email: string;
  gst: string;
  pan: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  website: string;
  status: string;
  notes: string;
}

export default function ClientOverview({
  companyName,
  clientCode,
  contactPerson,
  mobile,
  email,
  gst,
  pan,
  address,
  city,
  state,
  pincode,
  website,
  status,
  notes,
}: Props) {
  return (
    <div className="space-y-6">

      <div className="rounded-xl bg-white p-8 shadow-sm">

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold text-slate-900">
              {companyName}
            </h1>

            <p className="mt-2 text-slate-500">
              Client Code : {clientCode}
            </p>

          </div>

          <span
            className={`rounded-full px-4 py-2 font-medium ${
              status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {status}
          </span>

        </div>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        <div className="rounded-xl bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-xl font-bold">
            Contact Information
          </h2>

          <div className="space-y-4">

            <div>
              <p className="text-sm text-slate-500">
                Contact Person
              </p>
              <p className="font-semibold">
                {contactPerson}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Mobile
              </p>
              <p>{mobile}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Email
              </p>
              <p>{email}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Website
              </p>
              <p>{website}</p>
            </div>

          </div>

        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">

          <h2 className="mb-5 text-xl font-bold">
            Company Details
          </h2>

          <div className="space-y-4">

            <div>
              <p className="text-sm text-slate-500">
                GST Number
              </p>
              <p>{gst}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                PAN Number
              </p>
              <p>{pan}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Address
              </p>
              <p>{address}</p>
            </div>

            <div>
              <p>
                {city}, {state} - {pincode}
              </p>
            </div>

          </div>

        </div>

      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">

        <h2 className="mb-4 text-xl font-bold">
          Notes
        </h2>

        <p className="text-slate-600">
          {notes || "No notes available."}
        </p>

      </div>

    </div>
  );
}