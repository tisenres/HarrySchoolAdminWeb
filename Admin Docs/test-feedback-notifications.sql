-- Test script for feedback notification integration
-- This script tests the feedback notification triggers and functions

-- Test 1: Test feedback received notification trigger
DO $$
DECLARE
    test_org_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    test_student_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    test_teacher_id UUID := '550e8400-e29b-41d4-a716-446655440002';
    test_feedback_id UUID;
    notification_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting feedback notification integration tests...';
    
    -- Test 1: Insert a positive feedback entry and check if notification is created
    RAISE NOTICE 'Test 1: Testing feedback received notification trigger...';
    
    INSERT INTO feedback_entries (
        id,
        organization_id,
        from_user_id,
        from_user_type,
        to_user_id,
        to_user_type,
        group_id,
        feedback_type,
        rating,
        title,
        content,
        is_positive,
        category,
        points_awarded,
        is_public,
        is_anonymous,
        status,
        ranking_points_impact,
        affects_ranking,
        created_by
    ) VALUES (
        gen_random_uuid(),
        test_org_id,
        test_student_id,
        'student',
        test_teacher_id,
        'teacher',
        NULL,
        'performance',
        5,
        'Excellent Teaching!',
        'This teacher explains concepts very clearly and makes learning fun.',
        true,
        'teaching_quality',
        0,
        true,
        false,
        'active',
        75, -- High impact points for testing
        true,
        test_student_id
    ) RETURNING id INTO test_feedback_id;
    
    -- Check if feedback_received notification was created
    SELECT COUNT(*) INTO notification_count
    FROM notifications
    WHERE organization_id = test_org_id
    AND user_id = test_teacher_id
    AND type = 'feedback_received'
    AND metadata->>'feedback_id' = test_feedback_id::text;
    
    IF notification_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Feedback received notification created';
    ELSE
        RAISE NOTICE 'FAILURE: Feedback received notification NOT created';
    END IF;
    
    -- Check if feedback_impact notification was created (for high impact)
    SELECT COUNT(*) INTO notification_count
    FROM notifications
    WHERE organization_id = test_org_id
    AND user_id = test_teacher_id
    AND type = 'feedback_impact'
    AND metadata->>'feedback_id' = test_feedback_id::text;
    
    IF notification_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Feedback impact notification created';
    ELSE
        RAISE NOTICE 'FAILURE: Feedback impact notification NOT created';
    END IF;
    
    RAISE NOTICE 'Test 1 completed.';
    
END $$;

-- Test 2: Test feedback milestone notification
DO $$
DECLARE
    test_org_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    test_student_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    test_teacher_id UUID := '550e8400-e29b-41d4-a716-446655440002';
    notification_count INTEGER;
    i INTEGER;
BEGIN
    RAISE NOTICE 'Test 2: Testing feedback milestone notification trigger...';
    
    -- Clean up existing feedback for this teacher to test milestone accurately
    DELETE FROM feedback_entries 
    WHERE organization_id = test_org_id 
    AND to_user_id = test_teacher_id;
    
    -- Insert 5 feedback entries to trigger milestone
    FOR i IN 1..5 LOOP
        INSERT INTO feedback_entries (
            organization_id,
            from_user_id,
            from_user_type,
            to_user_id,
            to_user_type,
            feedback_type,
            rating,
            title,
            content,
            is_positive,
            category,
            is_anonymous,
            status,
            ranking_points_impact,
            affects_ranking,
            created_by
        ) VALUES (
            test_org_id,
            test_student_id,
            'student',
            test_teacher_id,
            'teacher',
            'performance',
            4,
            'Good feedback #' || i,
            'Test feedback content',
            true,
            'teaching_quality',
            false,
            'active',
            40,
            true,
            test_student_id
        );
    END LOOP;
    
    -- Check if milestone notification was created for 5 feedback
    SELECT COUNT(*) INTO notification_count
    FROM notifications
    WHERE organization_id = test_org_id
    AND user_id = test_teacher_id
    AND type = 'feedback_milestone'
    AND (metadata->>'milestone_count')::integer = 5;
    
    IF notification_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Feedback milestone notification created for 5 feedback';
    ELSE
        RAISE NOTICE 'FAILURE: Feedback milestone notification NOT created for 5 feedback';
    END IF;
    
    RAISE NOTICE 'Test 2 completed.';
    
END $$;

-- Test 3: Test feedback response notification
DO $$
DECLARE
    test_org_id UUID := '550e8400-e29b-41d4-a716-446655440000';
    test_student_id UUID := '550e8400-e29b-41d4-a716-446655440001';
    test_teacher_id UUID := '550e8400-e29b-41d4-a716-446655440002';
    test_admin_id UUID := '550e8400-e29b-41d4-a716-446655440003';
    test_feedback_id UUID;
    notification_count INTEGER;
BEGIN
    RAISE NOTICE 'Test 3: Testing feedback response notification trigger...';
    
    -- Insert a feedback entry
    INSERT INTO feedback_entries (
        organization_id,
        from_user_id,
        from_user_type,
        to_user_id,
        to_user_type,
        feedback_type,
        rating,
        title,
        content,
        is_positive,
        category,
        is_anonymous,
        status,
        ranking_points_impact,
        affects_ranking,
        created_by
    ) VALUES (
        test_org_id,
        test_student_id,
        'student',
        test_teacher_id,
        'teacher',
        'performance',
        3,
        'Needs improvement',
        'Could be better at time management',
        false,
        'time_management',
        false,
        'active',
        0,
        false,
        test_student_id
    ) RETURNING id INTO test_feedback_id;
    
    -- Add admin response to trigger notification
    UPDATE feedback_entries 
    SET admin_response = 'Thank you for your feedback. We will work on this.',
        responded_by = test_admin_id,
        responded_at = NOW(),
        status = 'reviewed'
    WHERE id = test_feedback_id;
    
    -- Check if response notification was created
    SELECT COUNT(*) INTO notification_count
    FROM notifications
    WHERE organization_id = test_org_id
    AND user_id = test_student_id
    AND type = 'feedback_response'
    AND metadata->>'feedback_id' = test_feedback_id::text;
    
    IF notification_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Feedback response notification created';
    ELSE
        RAISE NOTICE 'FAILURE: Feedback response notification NOT created';
    END IF;
    
    RAISE NOTICE 'Test 3 completed.';
    
END $$;

-- Test 4: Test feedback reminder function
DO $$
DECLARE
    reminder_count INTEGER;
BEGIN
    RAISE NOTICE 'Test 4: Testing feedback reminder notification function...';
    
    -- Call the reminder function
    SELECT send_feedback_reminder_notifications() INTO reminder_count;
    
    RAISE NOTICE 'Feedback reminder function executed. Notifications sent: %', reminder_count;
    
    RAISE NOTICE 'Test 4 completed.';
    
END $$;

-- Test 5: Verify notification types are properly constrained
DO $$
DECLARE
    constraint_valid BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE 'Test 5: Testing notification type constraints...';
    
    -- Try to insert a notification with feedback type
    BEGIN
        INSERT INTO notifications (
            organization_id,
            type,
            title,
            message
        ) VALUES (
            '550e8400-e29b-41d4-a716-446655440000',
            'feedback_received',
            'Test notification',
            'Test message'
        );
        constraint_valid := TRUE;
    EXCEPTION WHEN check_violation THEN
        constraint_valid := FALSE;
    END;
    
    IF constraint_valid THEN
        RAISE NOTICE 'SUCCESS: Feedback notification types are properly constrained';
        -- Clean up test notification
        DELETE FROM notifications 
        WHERE title = 'Test notification' 
        AND type = 'feedback_received';
    ELSE
        RAISE NOTICE 'FAILURE: Feedback notification types constraint failed';
    END IF;
    
    RAISE NOTICE 'Test 5 completed.';
    
END $$;

RAISE NOTICE 'All feedback notification integration tests completed!';

-- Clean up test data
DO $$
BEGIN
    RAISE NOTICE 'Cleaning up test data...';
    
    -- Delete test notifications
    DELETE FROM notifications 
    WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
    
    -- Delete test feedback entries  
    DELETE FROM feedback_entries 
    WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';
    
    RAISE NOTICE 'Test data cleanup completed.';
END $$;