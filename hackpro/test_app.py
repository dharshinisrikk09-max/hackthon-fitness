import unittest
import json
from app import app, TRAINERS, MAX_CONSULTATIONS, MAX_DISCONTINUATIONS

class FitnessPersonalTutorTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_1_trainers_dataset_integrity(self):
        """Verify all 10 gym experts are loaded with complete required attributes."""
        response = self.client.get('/api/trainers')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        trainers = data['trainers']
        self.assertEqual(len(trainers), 10, "Must have exactly 10 gym experts")

        expected_names = [
            "Jeff Cavaliere", "Tracy Anderson", "Yasmin Karachiwala",
            "Gunnar Peterson", "Nick Mitchell", "Jeanette Jenkins",
            "Kayla Itsines", "Tony Horton", "Nick Tumminello", "Alexia Clark"
        ]

        actual_names = [t['name'] for t in trainers]
        for name in expected_names:
            self.assertIn(name, actual_names)

        # Check required fields on each expert
        for t in trainers:
            self.assertTrue(t['experience'], f"{t['name']} must have experience")
            self.assertTrue(t['specialized_field'], f"{t['name']} must have specialized_field")
            self.assertTrue(t['major_achievements'], f"{t['name']} must have major_achievements")
            self.assertTrue(t['client_feedback'], f"{t['name']} must have client_feedback")
            self.assertTrue(t['icon'].endswith('.svg'), f"{t['name']} must have SVG icon")

    def test_2_consultation_limit_constraint(self):
        """Verify maximum 3 consultations total, and 4th attempt returns limit remembrance."""
        with self.client as c:
            # Reset session first
            c.post('/api/reset')

            # Perform 3 successful consultations
            for i in range(1, 4):
                res = c.post('/api/consult',
                             data=json.dumps({"trainer_id": i}),
                             content_type='application/json')
                self.assertEqual(res.status_code, 200)
                data = json.loads(res.data)
                self.assertTrue(data['success'])
                self.assertEqual(data['consultation_count'], i)

            # 4th consultation attempt must be blocked
            res_4 = c.post('/api/consult',
                           data=json.dumps({"trainer_id": 4}),
                           content_type='application/json')
            self.assertEqual(res_4.status_code, 400)
            data_4 = json.loads(res_4.data)
            self.assertFalse(data_4['success'])
            self.assertTrue(data_4.get('limit_exceeded'))
            self.assertIn('remembrance', data_4)
            self.assertIn('Consultation Limit Exceeded', data_4['remembrance'])

    def test_3_confirmation_flow(self):
        """Verify user can confirm an expert as their personal tutor and state is saved."""
        with self.client as c:
            c.post('/api/reset')
            res = c.post('/api/confirm',
                         data=json.dumps({"trainer_id": 1}),
                         content_type='application/json')
            self.assertEqual(res.status_code, 200)
            data = json.loads(res.data)
            self.assertTrue(data['success'])
            self.assertEqual(data['confirmed_trainer_id'], 1)
            self.assertEqual(data['redirect_url'], '/coach/1')

            # Verify session reflects confirmed trainer
            session_res = c.get('/api/session')
            session_data = json.loads(session_res.data)
            self.assertEqual(session_data['confirmed_trainer_id'], 1)

    def test_4_dedicated_coach_page_rendering(self):
        """Verify dedicated coach page renders with call console, reviews, and discontinue options."""
        res = self.client.get('/coach/1')
        self.assertEqual(res.status_code, 200)
        content = res.data.decode('utf-8')
        self.assertIn('Jeff Cavaliere', content)
        self.assertIn('callBtnDial', content)
        self.assertIn('reviewForm', content)
        self.assertIn('btnDiscontinue', content)
        self.assertIn('audioWaves', content)

    def test_5_discontinue_limit_constraint(self):
        """Verify maximum 2 discontinuations total, and 3rd attempt is rejected with remembrance."""
        with self.client as c:
            c.post('/api/reset')

            # Discontinue 1
            c.post('/api/confirm', data=json.dumps({"trainer_id": 1}), content_type='application/json')
            res1 = c.post('/api/discontinue', data=json.dumps({"trainer_id": 1}), content_type='application/json')
            self.assertEqual(res1.status_code, 200)
            data1 = json.loads(res1.data)
            self.assertEqual(data1['discontinue_count'], 1)
            self.assertEqual(data1['discontinues_remaining'], 1)

            # Discontinue 2
            c.post('/api/confirm', data=json.dumps({"trainer_id": 2}), content_type='application/json')
            res2 = c.post('/api/discontinue', data=json.dumps({"trainer_id": 2}), content_type='application/json')
            self.assertEqual(res2.status_code, 200)
            data2 = json.loads(res2.data)
            self.assertEqual(data2['discontinue_count'], 2)
            self.assertEqual(data2['discontinues_remaining'], 0)

            # Discontinue 3 (Must fail)
            c.post('/api/confirm', data=json.dumps({"trainer_id": 3}), content_type='application/json')
            res3 = c.post('/api/discontinue', data=json.dumps({"trainer_id": 3}), content_type='application/json')
            self.assertEqual(res3.status_code, 400)
            data3 = json.loads(res3.data)
            self.assertFalse(data3['success'])
            self.assertTrue(data3.get('limit_exceeded'))
            self.assertIn('remembrance', data3)
            self.assertIn('Discontinuation Limit Exceeded', data3['remembrance'])

    def test_6_feedback_and_reviews(self):
        """Verify adding feedback/reviews adds new review entry for the expert."""
        with self.client as c:
            new_review = {
                "author": "Ananth",
                "rating": 5,
                "comment": "Incredible personalized coaching program. Form critique was instant!"
            }
            res = c.post('/api/reviews/1',
                         data=json.dumps(new_review),
                         content_type='application/json')
            self.assertEqual(res.status_code, 200)
            data = json.loads(res.data)
            self.assertTrue(data['success'])
            self.assertEqual(data['review']['author'], 'Ananth')
            self.assertEqual(data['review']['comment'], new_review['comment'])

if __name__ == '__main__':
    unittest.main()
