import test from "node:test";
import assert from "node:assert/strict";
import { getHistoryLinks } from "../src/lib/consultation/history-links.mjs";

const consultationId = "12345678-1234-1234-1234-123456789abc";
const action = { consultationId, reportId: "action-report" };
const information = { consultationId, informationReportId: "information-report", informationReportAvailable: true };

test("legacy ACTION history keeps its existing detail route", () => {
  assert.deepEqual(getHistoryLinks(action), [
    { kind: "ACTION", href: `/consultation/report?consultationId=${consultationId}` },
  ]);
});

test("information-only and BOTH history expose only stored detail routes", () => {
  assert.deepEqual(getHistoryLinks(information), [
    { kind: "INFORMATION", href: `/consultation/information?consultationId=${consultationId}` },
  ]);
  assert.deepEqual(getHistoryLinks({ ...action, ...information }), [
    { kind: "ACTION", href: `/consultation/report?consultationId=${consultationId}` },
    { kind: "INFORMATION", href: `/consultation/information?consultationId=${consultationId}` },
  ]);
});

test("unfinished and inconsistent entries do not invent a report route", () => {
  assert.deepEqual(getHistoryLinks({ consultationId }), []);
  assert.deepEqual(getHistoryLinks({ consultationId, informationReportAvailable: true }), []);
  assert.deepEqual(getHistoryLinks({ ...action, actionReportAvailable: false }), []);
});
