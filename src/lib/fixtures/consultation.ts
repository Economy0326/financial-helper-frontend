export type SituationFixture = {
  content: string;
};

let savedSituation: SituationFixture | null = null;

const MOCK_DELAY = 300;
const MOCK_SITUATION_SUBMIT_ERROR = false;

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getSituationFixture() {
  await delay(MOCK_DELAY);

  return savedSituation;
}

export async function saveSituationFixture(content: string) {
  await delay(MOCK_DELAY);

  if (MOCK_SITUATION_SUBMIT_ERROR) {
    throw new Error("Mock situation submit error");
  }

  savedSituation = {
    content,
  };

  return savedSituation;
}