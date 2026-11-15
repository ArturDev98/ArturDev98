# Hi, I'm Arturo

I build AI agents and integrations that take repetitive work off teams running real operations.

Day to day I work as a developer on production systems for a microcredit fintech: a Java and Spring Boot back end, an Angular web app and a mobile app. I fix and tune live systems, trace incidents down to the code that causes them, and automate what repeats.

### Featured: QA flow with AI agents

[![Replay of a real run: the train stops at each agent and at every human review](https://raw.githubusercontent.com/ArturDev98/ai-automatization/main/docs/repeticion.gif)](https://arturdev98.github.io/ai-automatization/#accion)

A requirement goes in and comes out as a test plan, Playwright tests, a report and a traceability matrix. Four Claude Code agents do the work, each on the model that fits its task, and nothing gets automated until a person approves the plan. The GIF replays a real 102-minute run: a gate that failed, the plan approval, a case I added halfway and a flaky test that CI caught.

**[Open the live panel](https://arturdev98.github.io/ai-automatization/)** (English toggle at the top) · [Repository](https://github.com/ArturDev98/ai-automatization)

### What I've built

- **Help-desk triage agent** (in production, private): classifies incoming support tickets with AI, alerts the right people and summarizes the day. Review time per ticket went from up to 2 hours to up to 15 minutes. A public version rebuilt from scratch with fictional data: **[helpdesk-triage-agent](https://github.com/ArturDev98/helpdesk-triage-agent)**.
- **[Chat Privacy Shield](https://github.com/ArturDev98/Chat-Privacy-Shield)**: Chrome extension for visual privacy on WhatsApp Web and Telegram Web, published on the Chrome Web Store in six languages.
- **[Merged](https://github.com/ArturDev98/merged_app)**: Flutter app that brings GitLab activity, merge requests and pending reviews to your phone.

### Open-source tools

| Project | What it does | Stack |
|---|---|---|
| [helpdesk-triage-agent](https://github.com/ArturDev98/helpdesk-triage-agent) | Triages tickets with an LLM: classifies them, spots known issues and points to the likely cause in the code | Python · Claude API · SQLite |
| [git-team-insights](https://github.com/ArturDev98/git-team-insights) | Ranks developers by quality, not volume: bugs traced back with SZZ and the quality of the code they own | Python · git |
| [ci-image-notifier](https://github.com/ArturDev98/ci-image-notifier) | Tells the team chat which Docker images each Jenkins build published | Java 21 · Spring Boot · Jenkins |
| [elastic-explorer](https://github.com/ArturDev98/elastic-explorer) | Read-only Elasticsearch explorer per environment, with mapping trees and per-cluster users | Spring Boot · Spring Security · Angular |

### How I work

I test before shipping, measure the result, and document everything so someone else can take over.

### Stack

Python · Java · Spring Boot · TypeScript · JavaScript · Angular · Flutter · Playwright · SQL Server · Elasticsearch · Docker · GitLab CI · GitHub Actions · LLM APIs and AI agents
