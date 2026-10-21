# Hallucination and abstention report

The adapter rejects checkpoint IDs outside the selected rubric and timestamps outside sampled evidence; mocked adversarial tests confirm rejection. The real four-frame result produced zero unsupported checkpoint/timestamp citations and explicitly limited assessment between frames.

The real one-frame case returned `status=abstained`, `visibility_quality=insufficient`, no observations, and a request for multiple real-set frames from an appropriate view. This is the desired behavior. No injury diagnosis, exact angle, pain inference, or real-time correction claim appeared. No severe unsupported safety claim was observed.

