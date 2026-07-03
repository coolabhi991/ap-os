export interface Client {
  id: number;
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

const STORAGE_KEY = "ap-os-clients";

const defaultClients: Client[] = [
  {
    id: 1,
    companyName: "Nashik Municipal Corporation",
    clientCode: "CL-001",
    contactPerson: "Rajesh Patil",
    mobile: "9876543210",
    email: "nmc@nashik.gov.in",
    gst: "27ABCDE1234F1Z5",
    pan: "ABCDE1234F",
    address: "Main Road",
    city: "Nashik",
    state: "Maharashtra",
    pincode: "422001",
    website: "www.nmc.gov.in",
    status: "Active",
    notes: "Government Client",
  },
  {
    id: 2,
    companyName: "PWD Maharashtra",
    clientCode: "CL-002",
    contactPerson: "Amit Sharma",
    mobile: "9988776655",
    email: "pwd@gov.in",
    gst: "27PQRSX5678A1Z2",
    pan: "PQRSX5678A",
    address: "PWD Office",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    website: "www.mahapwd.gov.in",
    status: "Active",
    notes: "",
  },
];

function loadClients(): Client[] {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(defaultClients)
    );
    return defaultClients;
  }

  return JSON.parse(data);
}

function saveClients(clients: Client[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(clients)
  );
}

export function getClients() {
  return loadClients();
}

export function getClient(id: number) {
  return loadClients().find((c) => c.id === id);
}

export function createClient(
  client: Omit<Client, "id">
) {
  const clients = loadClients();

  clients.push({
    id: Date.now(),
    ...client,
  });

  saveClients(clients);
}

export function updateClient(
  id: number,
  data: Omit<Client, "id">
) {
  const clients = loadClients().map((c) =>
    c.id === id ? { id, ...data } : c
  );

  saveClients(clients);
}

export function deleteClient(id: number) {
  const clients = loadClients().filter(
    (c) => c.id !== id
  );

  saveClients(clients);
}