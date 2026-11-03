import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/contact/route";

test("contact validates details and only confirms accepted delivery", async () => {
 const oldFetch = globalThis.fetch;
 const keys = ["RESEND_API_KEY", "CONTACT_FROM", "CONTACT_TO"] as const;
 const old = keys.map(key => process.env[key]);
 const details = { name: "Test Visitor", email: "visitor@example.com", phone: "9876543210", role: "Other" };
 const send = (body: unknown) => POST(new Request("http://localhost/api/contact", { method: "POST", headers: {origin:"http://localhost"}, body: JSON.stringify(body) }));
 try {
  assert.equal((await send({})).status,400);
  assert.equal((await send({...details,phone:"-------"})).status,400);
  assert.equal((await send({...details,role:"invalid"})).status,400);
  delete process.env.RESEND_API_KEY;
  assert.equal((await send(details)).status,503);
  process.env.RESEND_API_KEY="mock-key"; process.env.CONTACT_FROM="website@example.com"; process.env.CONTACT_TO="team@example.com";
  globalThis.fetch=async (_url,init)=>{
   const payload=JSON.parse(String(init?.body));
   assert.deepEqual(payload.to,["team@example.com"]);
   assert.equal(payload.reply_to,details.email);
   for(const value of Object.values(details)) assert.ok(payload.text.includes(value));
   return Response.json({id:"mock-id"});
  };
  assert.equal((await send(details)).status,200);
  globalThis.fetch=async()=>Response.json({error:"rejected"},{status:500});
  assert.equal((await send(details)).status,502);
 } finally {globalThis.fetch=oldFetch; keys.forEach((key,i)=>{if(old[i]===undefined) delete process.env[key]; else process.env[key]=old[i];});}
});
