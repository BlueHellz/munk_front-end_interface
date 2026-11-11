-- Additive shared profiles, House posts/replies and private account messages.
CREATE TABLE viewer_profiles (
 account_id uuid PRIMARY KEY REFERENCES accounts(id),
 handle text NOT NULL UNIQUE CHECK(handle ~ '^[a-z][a-z0-9-]{2,29}$'),
 display_name text NOT NULL CHECK(char_length(trim(display_name)) BETWEEN 1 AND 80),
 bio text NOT NULL DEFAULT '' CHECK(char_length(bio)<=1000),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE board_posts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),house_id uuid NOT NULL REFERENCES houses(id),
 author_id uuid NOT NULL REFERENCES accounts(id),client_id uuid NOT NULL,
 body text NOT NULL CHECK(char_length(trim(body)) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(author_id,client_id)
);
CREATE INDEX board_posts_house_time_idx ON board_posts(house_id,created_at DESC,id DESC);
CREATE TABLE board_replies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),post_id uuid NOT NULL REFERENCES board_posts(id),
 author_id uuid NOT NULL REFERENCES accounts(id),client_id uuid NOT NULL,
 body text NOT NULL CHECK(char_length(trim(body)) BETWEEN 1 AND 4000),
 created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(author_id,client_id)
);
CREATE INDEX board_replies_post_time_idx ON board_replies(post_id,created_at,id);
CREATE TABLE message_conversations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_a uuid NOT NULL REFERENCES accounts(id),
 account_b uuid NOT NULL REFERENCES accounts(id),created_at timestamptz NOT NULL DEFAULT now(),
 CHECK(account_a<account_b),UNIQUE(account_a,account_b)
);
CREATE TABLE direct_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),conversation_id uuid NOT NULL REFERENCES message_conversations(id),
 sender_id uuid NOT NULL REFERENCES accounts(id),client_id uuid NOT NULL,
 body text NOT NULL CHECK(char_length(trim(body)) BETWEEN 1 AND 4000),created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(sender_id,client_id)
);
CREATE INDEX direct_messages_conversation_time_idx ON direct_messages(conversation_id,created_at DESC,id DESC);
