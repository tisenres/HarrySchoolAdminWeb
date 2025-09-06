-- Harry School CRM Functions and Triggers Migration
-- Version: 1.0.2

-- Function to update group enrollment counts
CREATE OR REPLACE FUNCTION update_group_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current_enrollment count for the affected group
    UPDATE groups 
    SET current_enrollment = (
        SELECT COUNT(*)
        FROM student_group_enrollments
        WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
        AND deleted_at IS NULL
        AND status IN ('enrolled', 'active')
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.group_id, OLD.group_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update enrollment counts
CREATE TRIGGER trigger_update_group_enrollment
    AFTER INSERT OR UPDATE OR DELETE ON student_group_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_group_enrollment_count();

-- Function to handle soft deletes with cascade
CREATE OR REPLACE FUNCTION soft_delete_cascade()
RETURNS TRIGGER AS $$
BEGIN
    -- Mark related records as deleted when parent is soft deleted
    CASE TG_TABLE_NAME
        WHEN 'teachers' THEN
            UPDATE teacher_group_assignments 
            SET deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
            WHERE teacher_id = NEW.id AND deleted_at IS NULL;
            
        WHEN 'students' THEN
            UPDATE student_group_enrollments 
            SET deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
            WHERE student_id = NEW.id AND deleted_at IS NULL;
            
        WHEN 'groups' THEN
            UPDATE teacher_group_assignments 
            SET deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
            WHERE group_id = NEW.id AND deleted_at IS NULL;
            
            UPDATE student_group_enrollments 
            SET deleted_at = NEW.deleted_at, deleted_by = NEW.deleted_by
            WHERE group_id = NEW.id AND deleted_at IS NULL;
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for soft delete cascade
CREATE TRIGGER trigger_soft_delete_teachers
    AFTER UPDATE OF deleted_at ON teachers
    FOR EACH ROW WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION soft_delete_cascade();

CREATE TRIGGER trigger_soft_delete_students
    AFTER UPDATE OF deleted_at ON students
    FOR EACH ROW WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION soft_delete_cascade();

CREATE TRIGGER trigger_soft_delete_groups
    AFTER UPDATE OF deleted_at ON groups
    FOR EACH ROW WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
    EXECUTE FUNCTION soft_delete_cascade();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER trigger_updated_at_organizations
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_teachers
    BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_students
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_groups
    BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_teacher_assignments
    BEFORE UPDATE ON teacher_group_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_student_enrollments
    BEFORE UPDATE ON student_group_enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_updated_at_notifications
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for anonymizing student data (GDPR compliance)
CREATE OR REPLACE FUNCTION anonymize_student_data(student_id UUID) 
RETURNS VOID AS $$
BEGIN
    UPDATE students SET
        first_name = 'Anonymous',
        last_name = 'Student',
        primary_phone = NULL,
        secondary_phone = NULL,
        email = NULL,
        address = NULL,
        parent_guardian_info = '[]'::jsonb,
        emergency_contacts = '[]'::jsonb,
        family_notes = NULL,
        medical_notes = NULL,
        allergies = NULL,
        notes = 'Data anonymized for privacy compliance'
    WHERE id = student_id AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Update schema version
INSERT INTO schema_versions (version, description) 
VALUES ('1.0.2', 'Added database functions and triggers for automation');