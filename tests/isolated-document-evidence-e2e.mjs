// Runs only from the guarded isolated PostgreSQL integration test.
import { spawn, spawnSync } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createInterface } from "node:readline";

const backend = Number(process.env.FH_UI_BACKEND_PORT);
const frontend = Number(process.env.FH_UI_FRONTEND_PORT);
const account = process.env.FH_UI_ACCOUNT_SESSION;
const other = process.env.FH_UI_OTHER_SESSION;
const reviewDocumentId = process.env.FH_UI_REVIEW_DOCUMENT_ID;
const reviewBasisUrl = process.env.FH_UI_REVIEW_BASIS_URL;
const registrationRegistryId = process.env.FH_UI_REGISTRY_ID;
if (!backend || !frontend || backend === 15432 || !account || !other || process.env.FH_UI_E2E !== "true") throw new Error("isolated test configuration required");
const root = process.cwd();
const profile = await mkdtemp(path.join(tmpdir(), "fh-ui-e2e-"));
const dist = `.next-ui-e2e-${randomUUID()}`;
const distPath = path.join(root, dist);
const isolatedTsconfig = `${distPath}.tsconfig.json`;
await copyFile(path.join(root, "tsconfig.json"), isolatedTsconfig);
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const serverEnv = { ...process.env, NEXT_PUBLIC_API_BASE_URL: `http://localhost:${backend}/api/v1`, FH_UI_TEST_DIST_DIR: dist, NEXT_TELEMETRY_DISABLED: "1" };
delete serverEnv.FH_UI_ACCOUNT_SESSION;
delete serverEnv.FH_UI_OTHER_SESSION;
for (const key of Object.keys(serverEnv)) if (/^(TEST_DB_|POSTGRES_|FH_TEST_)/.test(key)) delete serverEnv[key];
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "localhost", "--port", String(frontend)], {
  cwd: root, windowsHide: true, stdio: "ignore",
  env: serverEnv,
});
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--disable-background-networking", "--disable-component-update", "--no-first-run", "--no-default-browser-check",
  "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(action, label, timeout = 120000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    try { const result = await action(); if (result) return result; } catch { /* wait for startup or rendering */ }
    if (server.exitCode !== null || chrome.exitCode !== null) throw new Error(`${label}: process exited`);
    await pause(200);
  }
  throw new Error(`${label}: timeout`);
}
function stopOwned(child) {
  if (child.pid && child.exitCode === null) spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
}
let ws;
try {
  const port = await waitFor(async () => Number((await readFile(path.join(profile, "DevToolsActivePort"), "utf8")).split("\n")[0]), "Chrome startup");
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let sequence = 0;
  const pending = new Map();
  const requestCookies = [];
  let questionLogged = false;
  ws.onmessage = (event) => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id); pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  } else if (message.method === "Runtime.consoleAPICalled") {
    if (message.params.args.some(arg => typeof arg.value === "string" && arg.value.includes("신규"))) questionLogged = true;
  } else if (message.method === "Network.requestWillBeSentExtraInfo") {
    const headers = Object.fromEntries(Object.entries(message.params.headers).map(([k,v]) => [k.toLowerCase(), String(v)]));
    if (headers["x-xsrf-token"]) {
      const values = (headers.cookie ?? "").split(";").map(x => x.trim()).filter(x => x.startsWith("XSRF-TOKEN="));
      requestCookies.push({ count: values.length, matches: values.map(x => decodeURIComponent(x.slice(11)) === headers["x-xsrf-token"]) });
    }
  }};
  function cdp(method, params = {}) { return new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); }); }
  async function evaluate(expression) {
    const result = await cdp("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error("browser evaluation failed");
    return result.result.value;
  }
  await cdp("Network.enable");
  await cdp("Runtime.enable");
  const setCookie = await cdp("Network.setCookie", { name: "financial_helper_account", value: account, url: `http://localhost:${frontend}/`, sameSite: "Lax" });
  if (!setCookie.success) throw new Error("synthetic session cookie failed");
  await cdp("Page.enable");
  await cdp("Page.addScriptToEvaluateOnNewDocument", { source: `window.__testResponses=[];window.__testHttp=[];const originalFetch=window.fetch;window.fetch=async(...a)=>{try{const h=new Headers(a[1]?.headers);const csrf=h.get('X-XSRF-TOKEN');const cookies=document.cookie.split(';').map(x=>x.trim()).filter(x=>x.startsWith('XSRF-TOKEN='));const match=cookies.some(x=>decodeURIComponent(x.slice(11))===csrf);const r=await originalFetch(...a);window.__testHttp.push({path:new URL(String(a[0]),location.href).pathname,status:r.status,csrfHeader:!!csrf,csrfCookies:cookies.length,csrfMatch:match});if(String(a[0]).includes('information-evidence-snapshots')){try{window.__testResponses.push(await r.clone().json())}catch{}}return r}catch(e){window.__testHttp.push({status:'NETWORK_ERROR'});throw e}}` });
  await waitFor(async () => (await fetch(`http://localhost:${frontend}/financial-information`)).ok, "Next startup");
  if (reviewDocumentId && reviewBasisUrl) {
    await cdp("Page.navigate", { url: `http://localhost:${frontend}/official-source-review/documents` });
    if (registrationRegistryId) {
      await waitFor(() => evaluate("!![...document.querySelectorAll('summary')].find(x=>x.textContent.includes('검토할 텍스트 등록'))"), "registration control");
      await evaluate("[...document.querySelectorAll('summary')].find(x=>x.textContent.includes('검토할 텍스트 등록')).click()");
      await waitFor(() => evaluate(`!!document.querySelector('[aria-label="등록 출처"] option[value="${registrationRegistryId}"]')`), "registration source");
      await evaluate(`(()=>{const e=document.querySelector('[aria-label="등록 출처"]');e.value=${JSON.stringify(registrationRegistryId)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      const fill = (label, value) => evaluate(`(()=>{const e=document.querySelector('[aria-label='+JSON.stringify(${JSON.stringify(label)})+']');const p=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
      await fill("등록 문서 제목", "합성 신규 문서");
      await fill("등록 HTML", "<div class='body'><p>예금 안내</p><p>예금은 2025년 이후 적용됩니다. 다만 기존 계약은 제외합니다.</p><p>예금 신청은 공식 채널에서 확인해야 합니다.</p></div>");
      await fill("등록 이용조건 근거", `https://synthetic.invalid/${registrationRegistryId}`);
      await fill("등록 검토 사유", "합성 이용조건 확인");
      for (const name of ["저장·추출·검토 이용범위 확인", "개인정보 검토 완료", "제3자 권리 검토 완료"]) {
        const ok = await evaluate(`(()=>{const l=[...document.querySelectorAll('label')].find(x=>x.textContent.trim()===${JSON.stringify(name)});if(!l)return false;l.querySelector('input').click();return true})()`);
        if (!ok) throw new Error("registration checkbox unavailable");
      }
      await waitFor(() => evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='텍스트 등록');if(!b||b.disabled)return false;b.click();return true})()"), "register text");
      await waitFor(() => evaluate("document.querySelector('h1')?.innerText==='합성 신규 문서'"), "registered detail");
      await waitFor(() => evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Claim 검토 준비');if(!b||b.disabled)return false;b.click();return true})()"), "prepare registered claim");
      await waitFor(() => evaluate("[...document.querySelectorAll('article')].some(x=>x.innerText.includes('예금은 2025년')&&x.innerText.includes('CONDITION:')&&x.innerText.includes('EXCEPTION:'))"), "registered candidate and relations");
      await waitFor(() => evaluate("(()=>{const a=[...document.querySelectorAll('article')].find(x=>x.innerText.includes('예금은 2025년'));const b=a&&[...a.querySelectorAll('button')].find(x=>x.textContent.trim()==='승인하기');if(!b||b.disabled)return false;b.click();return true})()"), "approve registered claim");
      await waitFor(() => evaluate("[...document.querySelectorAll('article')].some(x=>x.innerText.includes('예금은 2025년')&&x.innerText.includes('상태 APPROVED'))"), "registered approval");
      await waitFor(() => evaluate("(()=>{const a=[...document.querySelectorAll('article')].find(x=>x.innerText.includes('예금 신청은'));const b=a&&[...a.querySelectorAll('button')].find(x=>x.textContent.trim()==='사용하지 않기');if(!b||b.disabled)return false;b.click();return true})()"), "reject registered claim");
      await waitFor(() => evaluate("[...document.querySelectorAll('article')].some(x=>x.innerText.includes('예금 신청은')&&x.innerText.includes('상태 REJECTED'))"), "registered rejection");
      await fill("이용조건 근거 URL", `https://synthetic.invalid/${registrationRegistryId}`);
      await fill("검토 사유", "합성 검색 이용범위 확인");
      for (const name of ["본문 저장", "추출", "검토", "검색", "원문 발췌", "개인정보 검토 완료", "제3자 권리 검토 완료"]) {
        const ok = await evaluate(`(()=>{const l=[...document.querySelectorAll('label')].find(x=>x.textContent.trim()===${JSON.stringify(name)});if(!l)return false;l.querySelector('input').click();return true})()`);
        if (!ok) throw new Error("registered usage control unavailable");
      }
      await evaluate("(()=>{const e=document.querySelector('[aria-label=\"이용조건 결정\"]');e.value='HOLD';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
      await waitFor(() => evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='이용조건 결정 저장');if(!b||b.disabled)return false;b.click();return true})()"), "registered rights recheck");
      await waitFor(() => evaluate("document.body.innerText.includes('현재 상태: HOLD')"), "registered rights on hold");
      await evaluate("(()=>{const e=document.querySelector('[aria-label=\"이용조건 결정\"]');e.value='ALLOWED';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
      await waitFor(() => evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='이용조건 결정 저장');if(!b||b.disabled)return false;b.click();return true})()"), "registered search rights");
      await waitFor(() => evaluate("document.body.innerText.includes('현재 상태: ALLOWED')"), "registered search rights saved");
      await waitFor(() => evaluate("[...document.querySelectorAll('[aria-label=\"기준 문서\"] option')].some(x=>x.value==='fsc-card-use-qa')"), "registered base document");
      await evaluate("(()=>{const e=document.querySelector('[aria-label=\"기준 문서\"]');e.value='fsc-card-use-qa';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
      const press = (label) => evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===${JSON.stringify(label)});if(!b||b.disabled)return false;b.click();return true})()`);
      await waitFor(() => press("READY 후보 생성"), "registered ready candidate");
      await waitFor(() => evaluate("document.body.innerText.includes('비활성 READY 후보를 만들었습니다.')"), "registered ready created");
      await waitFor(() => press("후보 빌드"), "registered build");
      await waitFor(() => evaluate("document.body.innerText.includes('후보 빌드를 마쳤습니다.')"), "registered built");
      await waitFor(() => press("활성화 요청"), "registered activate");
      await waitFor(() => evaluate("document.body.innerText.includes('활성화 요청을 처리했습니다.')"), "registered activated");
      const registeredDocumentId = await evaluate("location.pathname.split('/').pop()");
      // Exercise the newly registered document as a separate ordinary user.
      await cdp("Network.setCookie", { name: "financial_helper_account", value: other, url: `http://localhost:${frontend}/`, sameSite: "Lax" });
      await cdp("Page.navigate", { url: `http://localhost:${frontend}/financial-information` });
      await waitFor(() => evaluate("!!document.querySelector('#question')"), "registered user page");
      await evaluate("(()=>{const e=document.querySelector('#question');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'예금은');e.dispatchEvent(new Event('input',{bubbles:true}));})()");
      await waitFor(() => press("공식 근거 찾기"), "registered user search");
      await waitFor(() => evaluate(`window.__testResponses.some(x=>x.status==='READY_CANDIDATES'&&x.evidence?.some(e=>e.documentId===${JSON.stringify(registeredDocumentId)}))`), "registered document search");
      const registeredSnapshot = await evaluate(`window.__testResponses.find(x=>x.status==='READY_CANDIDATES'&&x.evidence?.some(e=>e.documentId===${JSON.stringify(registeredDocumentId)}))`);
      const registeredClaim = registeredSnapshot.evidence.find(e => e.documentId === registeredDocumentId);
      if (!registeredClaim?.claimId || !registeredClaim.locator || registeredClaim.currentApplicability !== 'NOT_VERIFIED') throw new Error('registered claim identity or currentness missing');
      if (registeredSnapshot.evidence.some(e => e.documentId === registeredDocumentId && e.excerpt.includes('예금 신청은'))) throw new Error('rejected claim appeared in search');
      await waitFor(() => press("결과 저장하기"), "registered report creation");
      await waitFor(() => evaluate(`window.__testResponses.some(x=>x.status==='READY'&&x.snapshotId===${JSON.stringify(registeredSnapshot.snapshotId)}&&x.evidence?.some(e=>e.claimId===${JSON.stringify(registeredClaim.claimId)}))`), "registered report identity");
      const registeredReportId = await evaluate(`window.__testResponses.find(x=>x.status==='READY'&&x.snapshotId===${JSON.stringify(registeredSnapshot.snapshotId)})?.reportId`);
      if (!registeredReportId) throw new Error('registered report identity missing');
      const baseApi = `http://localhost:${backend}/api/v1/information-evidence-snapshots`;
      for (const [suffix, expectedStatus] of [[registeredSnapshot.snapshotId, 'READY_CANDIDATES'], [`reports/${registeredReportId}`, 'READY']]) {
        const response = await fetch(`${baseApi}/${suffix}`, { headers: { cookie: `financial_helper_account=${other}` } });
        const result = await response.json();
        if (!response.ok || result.status !== expectedStatus || !result.evidence?.some(e => e.documentId === registeredDocumentId && e.claimId === registeredClaim.claimId)) throw new Error('registered current result identity mismatch');
      }
      // Revoke A via the same reviewer UI, then check the ordinary user's stored results.
      await cdp("Network.setCookie", { name: "financial_helper_account", value: account, url: `http://localhost:${frontend}/`, sameSite: "Lax" });
      await cdp("Page.navigate", { url: `http://localhost:${frontend}/official-source-review/documents/${registeredDocumentId}` });
      await waitFor(() => evaluate("document.body.innerText.includes('현재 상태: ALLOWED')"), "registered rights before withdrawal");
      await fill("이용조건 근거 URL", `https://synthetic.invalid/${registrationRegistryId}`);
      await fill("검토 사유", "합성 이용조건 철회");
      await evaluate("(()=>{const e=document.querySelector('[aria-label=\"이용조건 결정\"]');e.value='HOLD';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
      await waitFor(() => press("이용조건 결정 저장"), "registered withdrawal");
      await waitFor(() => evaluate("document.body.innerText.includes('현재 상태: HOLD')"), "registered withdrawn");
      await cdp("Network.setCookie", { name: "financial_helper_account", value: other, url: `http://localhost:${frontend}/`, sameSite: "Lax" });
      for (const suffix of [registeredSnapshot.snapshotId, `reports/${registeredReportId}`]) {
        const response = await fetch(`${baseApi}/${suffix}`, { headers: { cookie: `financial_helper_account=${other}` } });
        const result = await response.json();
        if (!response.ok || result.status !== 'STALE' || result.evidence?.length || result.explanation) throw new Error('registered stale result exposed');
      }
      await cdp("Page.navigate", { url: `http://localhost:${frontend}/financial-information` });
      await waitFor(() => evaluate("!!document.querySelector('#question')"), "withdrawn user page");
      await evaluate("(()=>{const e=document.querySelector('#question');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,'예금은');e.dispatchEvent(new Event('input',{bubbles:true}));})()");
      await waitFor(() => press("공식 근거 찾기"), "withdrawn search");
      await waitFor(() => evaluate("window.__testResponses.length>0"), "withdrawn search response");
      if (await evaluate(`window.__testResponses.some(x=>x.evidence?.some(e=>e.documentId===${JSON.stringify(registeredDocumentId)}))`)) throw new Error('withdrawn document returned in search');
      // Restore only the synthetic A rights so the separate existing mixed-generation regression remains valid.
      await cdp("Network.setCookie", { name: "financial_helper_account", value: account, url: `http://localhost:${frontend}/`, sameSite: "Lax" });
      await cdp("Page.navigate", { url: `http://localhost:${frontend}/official-source-review/documents/${registeredDocumentId}` });
      await waitFor(() => evaluate("document.body.innerText.includes('현재 상태: HOLD')"), "registered recheck");
      await fill("이용조건 근거 URL", `https://synthetic.invalid/${registrationRegistryId}`);
      await fill("검토 사유", "합성 재검토 완료");
      for (const name of ["본문 저장", "추출", "검토", "검색", "원문 발췌", "개인정보 검토 완료", "제3자 권리 검토 완료"]) {
        const ok = await evaluate(`(()=>{const l=[...document.querySelectorAll('label')].find(x=>x.textContent.trim()===${JSON.stringify(name)});if(!l)return false;l.querySelector('input').click();return true})()`);
        if (!ok) throw new Error('registered recheck control unavailable');
      }
      await evaluate("(()=>{const e=document.querySelector('[aria-label=\"이용조건 결정\"]');e.value='ALLOWED';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
      await waitFor(() => press("이용조건 결정 저장"), "registered reapproval");
      await waitFor(() => evaluate("document.body.innerText.includes('현재 상태: ALLOWED')"), "registered reapproved");
      await cdp("Page.navigate", { url: `http://localhost:${frontend}/official-source-review/documents` });
    }
    await waitFor(() => evaluate("[...document.querySelectorAll('a')].some(a=>a.textContent.trim()==='합성 안내')"), "review document inventory");
    await evaluate("[...document.querySelectorAll('button')].find(x=>x.textContent.includes('이용조건 확인 필요')).click()");
    await waitFor(() => evaluate("[...document.querySelectorAll('a')].some(a=>a.textContent.trim()==='합성 안내')"), "document status filter");
    const forbidden = await fetch(`http://localhost:${backend}/api/v1/source-review/document-claims`, { headers: { cookie: `financial_helper_account=${other}` } });
    if (forbidden.status !== 403) throw new Error("non-reviewer inventory access accepted");
    await evaluate("[...document.querySelectorAll('a')].find(a=>a.textContent.trim()==='합성 안내').click()");
    await waitFor(() => evaluate("document.body.innerText.includes('현재 상태: 미검토')"), "unreviewed document");
    if (!(await evaluate("[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='READY 후보 생성')?.disabled"))) throw new Error("unreviewed rights allowed READY");
    const input = (label, value) => evaluate(`(()=>{const e=document.querySelector('[aria-label='+JSON.stringify(${JSON.stringify(label)})+']');const p=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await input("이용조건 근거 URL", reviewBasisUrl);
    await input("검토 사유", "synthetic");
    for (const name of ["본문 저장", "추출", "검토", "검색", "원문 발췌", "개인정보 검토 완료", "제3자 권리 검토 완료"]) {
      const clicked = await evaluate(`(()=>{const l=[...document.querySelectorAll('label')].find(x=>x.textContent.trim()===${JSON.stringify(name)});if(!l)return false;l.querySelector('input').click();return true})()`);
      if (!clicked) throw new Error(`rights control missing: ${name}`);
    }
    await evaluate("(()=>{const e=document.querySelector('[aria-label=\"이용조건 결정\"]');e.value='ALLOWED';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
    const clickReview = (label) => evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(label)}&&!e.disabled);if(!b)return false;b.click();return true})()`);
    await waitFor(() => clickReview("이용조건 결정 저장"), "rights decision button");
    await waitFor(() => evaluate("document.body.innerText.includes('현재 상태: ALLOWED')"), "rights decision");
    await waitFor(() => clickReview("Claim 검토 준비"), "prepare claims button");
    await waitFor(() => evaluate("[...document.querySelectorAll('article')].some(x=>x.innerText.includes('SUPPORT:')&&x.innerText.includes('EXCEPTION:')&&x.innerText.includes('CONDITION:'))"), "claim context");
    await evaluate("[...document.querySelectorAll('button')].find(x=>x.textContent.includes('검토 필요')).click()");
    await waitFor(() => evaluate("[...document.querySelectorAll('article')].every(x=>x.dataset.claimBucket==='pending')"), "claim pending filter");
    await evaluate("[...document.querySelectorAll('button')].find(x=>x.textContent.includes('검토 필요')).click()");
    const approve = await evaluate("(()=>{const a=[...document.querySelectorAll('article')].find(x=>x.innerText.includes('신규 대출'));const b=[...a.querySelectorAll('button')].find(x=>x.textContent.trim()==='승인하기');if(!b||b.disabled)return false;b.click();return true})()");
    if (!approve) throw new Error("approve control unavailable");
    await waitFor(() => evaluate("[...document.querySelectorAll('article')].some(x=>x.innerText.includes('신규 대출')&&x.innerText.includes('상태 APPROVED'))"), "claim approval");
    const reject = await evaluate("(()=>{const a=[...document.querySelectorAll('article')].find(x=>x.innerText.includes('대출 신청은'));const b=a&&[...a.querySelectorAll('button')].find(x=>x.textContent.trim()==='사용하지 않기');if(!b||b.disabled)return false;b.click();return true})()");
    if (!reject) throw new Error("reject control unavailable");
    await waitFor(() => evaluate("[...document.querySelectorAll('article')].some(x=>x.innerText.includes('대출 신청은')&&x.innerText.includes('상태 REJECTED'))"), "claim rejection");
    await evaluate("[...[...document.querySelectorAll('article')].find(x=>x.innerText.includes('신규 대출')).querySelectorAll('summary')].find(x=>x.textContent.includes('Claim 감사 이력')).click()");
    await waitFor(() => evaluate("[...document.querySelectorAll('article')].some(x=>x.innerText.includes('신규 대출')&&x.innerText.includes('DOCUMENT_CLAIM_REVIEW'))"), "approval audit");
    await input("검토 사유", "synthetic withdrawal");
    await evaluate("(()=>{const e=document.querySelector('[aria-label=\"이용조건 결정\"]');e.value='HOLD';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
    await waitFor(() => clickReview("이용조건 결정 저장"), "rights withdrawal button");
    await waitFor(() => evaluate("document.body.innerText.includes('현재 상태: HOLD')"), "rights withdrawal status");
    if (!(await evaluate("[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='READY 후보 생성')?.disabled"))) throw new Error("withdrawn rights allowed READY");
    await input("검토 사유", "synthetic reapproval");
    await evaluate("(()=>{const e=document.querySelector('[aria-label=\"이용조건 결정\"]');e.value='ALLOWED';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
    await waitFor(() => clickReview("이용조건 결정 저장"), "rights reapproval button");
    await waitFor(() => evaluate("document.body.innerText.includes('현재 상태: ALLOWED')"), "rights reapproval status");
    await waitFor(() => evaluate("[...document.querySelectorAll('[aria-label=\"기준 문서\"] option')].some(x=>x.value==='fsc-card-use-qa')"), "approved base document");
    await evaluate("(()=>{const e=document.querySelector('[aria-label=\"기준 문서\"]');e.value='fsc-card-use-qa';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
    await waitFor(() => clickReview("READY 후보 생성"), "READY candidate button");
    try {
      await waitFor(() => evaluate("document.body.innerText.includes('비활성 READY 후보를 만들었습니다.')&&document.body.innerText.includes('Generation PROCESSING')&&document.body.innerText.includes('빌드 미시작')"), "READY candidate status", 30000);
    } catch {
      const diagnostic = await evaluate("({http:window.__testHttp.filter(x=>x.path?.includes('ready-candidate')),alerts:[...document.querySelectorAll('[role=alert]')].map(x=>x.innerText)})");
      throw new Error(`READY candidate failed: ${JSON.stringify(diagnostic)}`);
    }
    await waitFor(() => clickReview("후보 빌드"), "build candidate button");
    await waitFor(() => evaluate("document.body.innerText.includes('후보 빌드를 마쳤습니다.')&&document.body.innerText.includes('빌드 BUILT')"), "candidate build status");
    await waitFor(() => clickReview("활성화 요청"), "activate candidate button");
    await waitFor(() => evaluate("document.body.innerText.includes('활성화 요청을 처리했습니다.')&&document.body.innerText.includes('활성 포인터')"), "candidate activation status");
    process.stdout.write("READY\n");
  } else {
  await cdp("Page.navigate", { url: `http://localhost:${frontend}/financial-information` });
  await waitFor(() => evaluate("!!document.querySelector('#question')"), "authenticated page");
  const click = (label) => evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(label)}&&!e.disabled);if(!b)return false;b.click();return true})()`);
  const setQuestion = (value) => evaluate(`(()=>{const e=document.querySelector('#question');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await setQuestion("test@example.invalid");
  await waitFor(() => click("공식 근거 찾기"), "privacy search button");
  await waitFor(() => evaluate("window.__testHttp.some(x=>x.path.endsWith('information-evidence-snapshots')&&x.status===400)&&!!document.querySelector('[role=alert]')"), "privacy rejection");
  await setQuestion("존재하지않는합성단어");
  await waitFor(() => click("공식 근거 찾기"), "empty search button");
  await waitFor(() => evaluate("window.__testResponses.some(x=>x.status==='NO_MATCH')&&document.body.innerText.includes('승인 근거를 찾지 못했어요')"), "no evidence state");
  await setQuestion("신규");
  await waitFor(() => click("공식 근거 찾기"), "search button");
  try { await waitFor(() => evaluate("document.body.innerText.includes('확인된 문서 내용')"), "real search", 45000); }
  catch { const diagnostic = await evaluate("({http:window.__testHttp,alert:document.querySelector('[role=alert]')?.innerText,status:document.querySelector('[role=status]')?.innerText})"); throw new Error(`real search: ${JSON.stringify({ ...diagnostic, requestCookies })}`); }
  const textOk = await evaluate("['신규 대출','조건','예외','2025-01-01','현재 적용 여부 미확인','합성 안내','원문 위치:'].every(t=>document.body.innerText.includes(t))");
  if (!textOk) throw new Error("source, condition, exception or time context missing");
  await waitFor(() => click("저장된 근거 다시 확인"), "snapshot refresh button");
  await waitFor(() => evaluate("window.__testResponses.filter(x=>x.status==='READY_CANDIDATES').length>=2 && document.body.innerText.includes('확인된 문서 내용')"), "snapshot refresh");
  await waitFor(() => click("결과 저장하기"), "create report button");
  await waitFor(() => evaluate("document.body.innerText.includes('저장된 결과')"), "report creation");
  await waitFor(() => click("저장된 결과 다시 확인"), "report refresh button");
  await waitFor(() => evaluate("window.__testResponses.filter(x=>x.status==='READY').length>=2 && document.body.innerText.includes('저장된 결과')"), "report refresh");
  const ids = await evaluate("({snapshot:window.__testResponses.find(x=>x.snapshotId&&x.status==='READY_CANDIDATES')?.snapshotId,report:window.__testResponses.find(x=>x.reportId&&x.status==='READY')?.reportId})");
  if (!ids.snapshot || !ids.report) throw new Error("snapshot/report identity missing");
  const base = `http://localhost:${backend}/api/v1/information-evidence-snapshots`;
  const anonymousSession = await fetch(`http://localhost:${backend}/api/v1/session`);
  const anonymousCsrf = anonymousSession.headers.get("X-XSRF-TOKEN");
  if (!anonymousCsrf) throw new Error("anonymous CSRF bootstrap failed");
  const unauthorized = await fetch(base, { method: "POST", headers: { "content-type": "application/json", "X-XSRF-TOKEN": anonymousCsrf,
    cookie: `XSRF-TOKEN=${encodeURIComponent(anonymousCsrf)}` }, body: JSON.stringify({ question: "신규" }) });
  if (![401, 403].includes(unauthorized.status)) throw new Error("anonymous request accepted");
  const csrf = await fetch(base, { method: "POST", headers: { "content-type": "application/json", cookie: `financial_helper_account=${account}` }, body: JSON.stringify({ question: "신규" }) });
  if (csrf.status !== 403) throw new Error("missing CSRF accepted");
  for (const suffix of [ids.snapshot, `reports/${ids.report}`]) {
    const response = await fetch(`${base}/${suffix}`, { headers: { cookie: `financial_helper_account=${other}` } });
    if (response.status !== 404) throw new Error("cross-account access accepted");
  }
  if ((await evaluate("location.href")).includes(encodeURIComponent("신규"))) throw new Error("question in URL");
  process.stdout.write("READY\n");
  const lines = createInterface({ input: process.stdin });
  const signal = await new Promise((resolve) => lines.once("line", resolve));
  lines.close();
  if (signal !== "REVOKED") throw new Error("revocation signal missing");
  await waitFor(() => click("저장된 결과 다시 확인"), "revoked report button");
  await waitFor(() => evaluate("document.body.innerText.includes('저장된 결과의 근거가 변경')"), "revoked report");
  if (await evaluate("document.body.innerText.includes('신규 대출은')")) throw new Error("revoked report content visible");
  await waitFor(() => click("저장된 근거 다시 확인"), "revoked snapshot button");
  await waitFor(() => evaluate("document.body.innerText.includes('근거를 다시 확인해야')"), "revoked snapshot");
  if (await evaluate("document.body.innerText.includes('신규 대출은')")) throw new Error("revoked snapshot content visible");
  if (questionLogged) throw new Error("question appeared in browser console");
  }
} catch (error) {
  console.error(`Isolated UI test failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  ws?.close(); stopOwned(chrome); stopOwned(server);
  if (path.dirname(profile) === tmpdir() && path.basename(profile).startsWith("fh-ui-e2e-")) await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  if (path.dirname(distPath) === root && path.basename(distPath).startsWith(".next-ui-e2e-")) await rm(distPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  if (path.dirname(isolatedTsconfig) === root && path.basename(isolatedTsconfig).startsWith(".next-ui-e2e-")) await rm(isolatedTsconfig, { force: true });
}
