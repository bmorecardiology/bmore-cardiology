# Clinical review of the patient education update

Prepared September 8, 2026. Clinical sign-off by Dr. Pollock is pending. “Updated” dates describe this revision; they are not a claim of physician review.

## Changes requiring clinical review

| Pages | Main changes and review focus |
| --- | --- |
| Hypertension, home-BP note, BP log PDF | Keep both numbers from two readings one minute apart; individual monitoring schedule; structured series for diagnosis or medication review; no requirement to wait 12 weeks to report a concern. Confirm the emergency wording and routine contact instructions. |
| Statins and statin note | Replace the incorrect “Sampson 2014” account with SAMSON: Howard et al., JACC 2021; 60 participants; atorvastatin 20 mg, placebo and no-tablet months. Remove CoQ10 attribution to SAMSON. Acknowledge possible symptoms with normal CK and supervised treatment adjustment. |
| Calcium-score condition/test guides and PDF | Distinguish plaque burden from percentage stenosis, explain limits of CAC zero, individualize lipid decisions, and weigh aspirin against bleeding risk rather than prescribing from CAC alone. |
| AFib | Stroke-risk assessment, rate/rhythm treatment, anticoagulation after ablation/cardioversion, and symptom escalation. |
| Heart failure | Reduced/preserved EF, major medication groups, individualized fluid/weight plans, and no self-directed extra diuretic dosing. |
| Coronary disease | Clarify test purposes, prevention and symptom treatment, and indications for discussing procedures and rehabilitation. |
| Aortic stenosis | Symptom reporting, individualized echo follow-up and valve-team choice of TAVR versus surgery. |
| Five test guides and PDFs | Echo, rhythm/Zio monitor, CAC, stress testing and CCTA. Check preparation language against actual local testing instructions. No blanket medication-holding instructions. Monitor symptom logging is not emergency monitoring. |
| Three exercise articles and exercise note | Practical starting activity, return after diagnosis/procedure, and rehabilitation. Confirm restrictions and red flags; keep vigorous/endurance training individualized. |
| Cardiac longevity | Use Life's Essential 8, individualized targets and the 2026 lipid guidance on Lp(a)/selective apoB testing. |

The 19 articles, notes and detailed guides have reference sections and visit questions. Source URLs are maintained centrally in `scripts/content_data.py`. Sources were checked against AHA, ACC, ACR/RSNA RadiologyInfo, MedlinePlus, the SAMSON paper and the device manufacturer's guidance. External sites can change; the local link checker does not revalidate their content or availability.

## Record an actual review

After a clinician reviews a particular page, add `reviewed_by` and `reviewed_on` to that page's data entry in `scripts/content_data.py`, using the clinician's agreed display name and the actual review date. The generator only displays “Reviewed by” when both are present. Do not infer a review from a code merge or from this document.

The six PDFs display an update date and sources. If they receive separate medical review, record it here with the actual reviewer, date and files reviewed. Rebuild PDFs when the associated advice changes; their concise copy lives in `scripts/build_handouts.py`.

## Editorial details

Existing URLs remain available, including `thoughts-of-the-week.html`, now titled “Dr. Pollock's Notes.” The two previously missing blog URLs now contain complete articles. The About biography and its existing credentials, ratings and event details are preserved; this update does not newly verify those biographical claims. The independent educational-resource statement remains in the footer.

The tracker stores readings only in the same browser profile and origin. It does not submit data, provide monitoring, or send alerts. Historical measurements remain under the original `vitalReadings` key. A separate person filter prevents mixed-person averages. Review the patient-facing notice for clarity.

Six proposed video scripts are in `docs/video-scripts.md`; clinician review, recording and final media publication remain to be done.
