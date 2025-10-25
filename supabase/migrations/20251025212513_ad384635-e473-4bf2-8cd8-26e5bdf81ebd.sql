-- Move all appointments from 'new' to 'booked' stage
UPDATE appointments 
SET pipeline_stage = 'booked' 
WHERE pipeline_stage = 'new' 
AND team_id = 'c2cbfeed-8710-428b-966d-534804a256fb';

-- Remove the 'new' stage since appointments are already booked when imported
DELETE FROM team_pipeline_stages 
WHERE stage_id = 'new' 
AND team_id = 'c2cbfeed-8710-428b-966d-534804a256fb';