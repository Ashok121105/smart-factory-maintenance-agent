I built Smart Factory Maintenance Agent to help technicians investigate recurring machine faults using current condition data, Hindsight memory, Groq reasoning, and technician-confirmed outcomes.

The loop is OBSERVE → RECALL → REASON → ACT → LEARN: capture the condition, retrieve relevant past maintenance experience, reason with that context, confirm the action/result, and retain the outcome for future cases.

I used the M-101 overheating case to show how the system recalls past fixes and stores the technician-confirmed cooling-fan outcome. This demo uses simulated/manual input, not live sensors or guaranteed failure prediction.

https://smart-factory-maintenance-agent.vercel.app
#AI #AIagents #Hindsight #Maintenance

Hindsight GitHub comment:
https://github.com/vectorize-io/hindsight
