--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: api_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.api_settings (
    id integer NOT NULL,
    whm_api_url character varying(255) NOT NULL,
    whm_api_token character varying(500) NOT NULL,
    cpanel_base_url character varying(255) NOT NULL,
    email_from_address character varying(255) NOT NULL,
    email_from_name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.api_settings OWNER TO neondb_owner;

--
-- Name: api_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.api_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.api_settings_id_seq OWNER TO neondb_owner;

--
-- Name: api_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.api_settings_id_seq OWNED BY public.api_settings.id;


--
-- Name: custom_header_code; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.custom_header_code (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code text NOT NULL,
    is_active boolean DEFAULT true,
    "position" integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.custom_header_code OWNER TO neondb_owner;

--
-- Name: custom_header_code_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.custom_header_code_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.custom_header_code_id_seq OWNER TO neondb_owner;

--
-- Name: custom_header_code_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.custom_header_code_id_seq OWNED BY public.custom_header_code.id;


--
-- Name: device_fingerprints; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.device_fingerprints (
    id integer NOT NULL,
    user_id integer,
    fingerprint_hash character varying NOT NULL,
    mac_address character varying,
    user_agent text,
    screen_resolution character varying,
    timezone character varying,
    language character varying,
    platform_info text,
    ip_address character varying,
    last_seen timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    canvas_fingerprint text,
    webgl_fingerprint text,
    audio_fingerprint character varying
);


ALTER TABLE public.device_fingerprints OWNER TO neondb_owner;

--
-- Name: device_fingerprints_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.device_fingerprints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.device_fingerprints_id_seq OWNER TO neondb_owner;

--
-- Name: device_fingerprints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.device_fingerprints_id_seq OWNED BY public.device_fingerprints.id;


--
-- Name: domain_search_cache; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.domain_search_cache (
    id integer NOT NULL,
    domain character varying NOT NULL,
    "isAvailable" boolean NOT NULL,
    "lastChecked" timestamp without time zone NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    "searchSource" character varying NOT NULL,
    "searchResults" text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.domain_search_cache OWNER TO neondb_owner;

--
-- Name: domain_search_cache_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.domain_search_cache_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.domain_search_cache_id_seq OWNER TO neondb_owner;

--
-- Name: domain_search_cache_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.domain_search_cache_id_seq OWNED BY public.domain_search_cache.id;


--
-- Name: donations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.donations (
    id integer NOT NULL,
    user_id integer,
    amount integer NOT NULL,
    currency character varying DEFAULT 'USD'::character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    payment_method character varying,
    donor_email character varying,
    message text,
    created_at timestamp without time zone DEFAULT now(),
    stripe_subscription_id character varying,
    stripe_customer_id character varying,
    is_recurring boolean DEFAULT false NOT NULL,
    subscription_status character varying,
    gift_tier character varying,
    gift_type character varying,
    gift_details text,
    stripe_payment_intent_id text,
    plugin_id integer,
    plugin_name text
);


ALTER TABLE public.donations OWNER TO neondb_owner;

--
-- Name: donations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.donations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.donations_id_seq OWNER TO neondb_owner;

--
-- Name: donations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.donations_id_seq OWNED BY public.donations.id;


--
-- Name: facebook_pixel_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.facebook_pixel_settings (
    id integer NOT NULL,
    pixel_id text NOT NULL,
    access_token text,
    is_active boolean DEFAULT true,
    track_page_views boolean DEFAULT true,
    track_purchases boolean DEFAULT true,
    purchase_event_value numeric(10,2) DEFAULT 5.00,
    test_mode boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.facebook_pixel_settings OWNER TO neondb_owner;

--
-- Name: facebook_pixel_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.facebook_pixel_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.facebook_pixel_settings_id_seq OWNER TO neondb_owner;

--
-- Name: facebook_pixel_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.facebook_pixel_settings_id_seq OWNED BY public.facebook_pixel_settings.id;


--
-- Name: hosting_accounts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.hosting_accounts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    domain character varying NOT NULL,
    subdomain character varying NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    disk_usage integer DEFAULT 0,
    disk_limit integer DEFAULT 5120,
    bandwidth_used integer DEFAULT 0,
    bandwidth_limit integer DEFAULT 10240,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    package_id integer,
    cpanel_username character varying(255),
    cpanel_password character varying(255),
    whm_account_id character varying(255)
);


ALTER TABLE public.hosting_accounts OWNER TO neondb_owner;

--
-- Name: hosting_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.hosting_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hosting_accounts_id_seq OWNER TO neondb_owner;

--
-- Name: hosting_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.hosting_accounts_id_seq OWNED BY public.hosting_accounts.id;


--
-- Name: hosting_packages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.hosting_packages (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    price integer DEFAULT 0 NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    disk_space_quota integer NOT NULL,
    bandwidth_quota integer NOT NULL,
    email_accounts integer DEFAULT 0 NOT NULL,
    databases integer DEFAULT 0 NOT NULL,
    subdomains integer DEFAULT 0 NOT NULL,
    whm_package_name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    is_free boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.hosting_packages OWNER TO neondb_owner;

--
-- Name: hosting_packages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.hosting_packages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hosting_packages_id_seq OWNER TO neondb_owner;

--
-- Name: hosting_packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.hosting_packages_id_seq OWNED BY public.hosting_packages.id;


--
-- Name: package_usage; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.package_usage (
    id integer NOT NULL,
    hosting_account_id integer NOT NULL,
    disk_used integer DEFAULT 0 NOT NULL,
    bandwidth_used integer DEFAULT 0 NOT NULL,
    email_accounts_used integer DEFAULT 0 NOT NULL,
    databases_used integer DEFAULT 0 NOT NULL,
    subdomains_used integer DEFAULT 0 NOT NULL,
    last_updated timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.package_usage OWNER TO neondb_owner;

--
-- Name: package_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.package_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.package_usage_id_seq OWNER TO neondb_owner;

--
-- Name: package_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.package_usage_id_seq OWNED BY public.package_usage.id;


--
-- Name: pending_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pending_orders (
    id integer NOT NULL,
    "orderType" character varying NOT NULL,
    "orderId" integer NOT NULL,
    "customerEmail" character varying NOT NULL,
    "customerName" character varying,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    "orderDetails" text NOT NULL,
    "totalPrice" integer NOT NULL,
    currency character varying DEFAULT 'USD'::character varying NOT NULL,
    "processedBy" integer,
    "processedAt" timestamp without time zone,
    "rejectionReason" text,
    "adminNotes" text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pending_orders OWNER TO neondb_owner;

--
-- Name: pending_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pending_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pending_orders_id_seq OWNER TO neondb_owner;

--
-- Name: pending_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pending_orders_id_seq OWNED BY public.pending_orders.id;


--
-- Name: plugin_downloads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.plugin_downloads (
    id integer NOT NULL,
    plugin_id integer NOT NULL,
    user_id integer NOT NULL,
    downloaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plugin_downloads OWNER TO neondb_owner;

--
-- Name: plugin_downloads_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.plugin_downloads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plugin_downloads_id_seq OWNER TO neondb_owner;

--
-- Name: plugin_downloads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.plugin_downloads_id_seq OWNED BY public.plugin_downloads.id;


--
-- Name: plugin_requests; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.plugin_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    plugin_name character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.plugin_requests OWNER TO neondb_owner;

--
-- Name: plugin_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.plugin_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plugin_requests_id_seq OWNER TO neondb_owner;

--
-- Name: plugin_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.plugin_requests_id_seq OWNED BY public.plugin_requests.id;


--
-- Name: plugins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.plugins (
    id integer NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    description text,
    category character varying NOT NULL,
    version character varying NOT NULL,
    author character varying,
    file_name character varying NOT NULL,
    file_size integer,
    download_count integer DEFAULT 0,
    image_url character varying,
    is_active boolean DEFAULT true,
    uploaded_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    file_path character varying,
    is_public boolean DEFAULT false
);


ALTER TABLE public.plugins OWNER TO neondb_owner;

--
-- Name: plugins_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.plugins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.plugins_id_seq OWNER TO neondb_owner;

--
-- Name: plugins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.plugins_id_seq OWNED BY public.plugins.id;


--
-- Name: premium_hosting_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.premium_hosting_orders (
    id integer NOT NULL,
    "customerEmail" character varying NOT NULL,
    "customerName" character varying,
    "domainName" character varying NOT NULL,
    "orderType" character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    "domainPrice" integer NOT NULL,
    "finalPrice" integer NOT NULL,
    "profitMargin" numeric(5,2) NOT NULL,
    "stripePaymentIntentId" character varying,
    "stripeCustomerId" character varying,
    "paymentStatus" character varying DEFAULT 'pending'::character varying NOT NULL,
    "externalOrderId" character varying,
    "externalStatus" character varying,
    "processedBy" integer,
    "processedAt" timestamp without time zone,
    "cpanelUsername" character varying,
    "cpanelPassword" character varying,
    "cpanelUrl" character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.premium_hosting_orders OWNER TO neondb_owner;

--
-- Name: premium_hosting_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.premium_hosting_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.premium_hosting_orders_id_seq OWNER TO neondb_owner;

--
-- Name: premium_hosting_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.premium_hosting_orders_id_seq OWNED BY public.premium_hosting_orders.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: smtp_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.smtp_settings (
    id integer NOT NULL,
    host character varying(255) NOT NULL,
    port integer DEFAULT 587 NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(500) NOT NULL,
    encryption character varying(10) DEFAULT 'tls'::character varying,
    from_email character varying(255) NOT NULL,
    from_name character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.smtp_settings OWNER TO neondb_owner;

--
-- Name: smtp_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.smtp_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.smtp_settings_id_seq OWNER TO neondb_owner;

--
-- Name: smtp_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.smtp_settings_id_seq OWNED BY public.smtp_settings.id;


--
-- Name: stripe_settings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stripe_settings (
    id integer NOT NULL,
    public_key character varying(255),
    secret_key character varying(255),
    webhook_secret character varying(255),
    is_test_mode boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stripe_settings OWNER TO neondb_owner;

--
-- Name: stripe_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stripe_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stripe_settings_id_seq OWNER TO neondb_owner;

--
-- Name: stripe_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stripe_settings_id_seq OWNED BY public.stripe_settings.id;


--
-- Name: user_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_groups (
    id integer NOT NULL,
    name character varying NOT NULL,
    display_name character varying NOT NULL,
    description text,
    max_hosting_accounts integer DEFAULT 2 NOT NULL,
    max_devices integer DEFAULT 2 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_groups OWNER TO neondb_owner;

--
-- Name: user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_groups_id_seq OWNER TO neondb_owner;

--
-- Name: user_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_groups_id_seq OWNED BY public.user_groups.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying NOT NULL,
    email character varying,
    password character varying NOT NULL,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    role character varying DEFAULT 'client'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    recovery_phrase character varying,
    is_anonymous boolean DEFAULT true,
    user_group_id integer,
    display_password character varying
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: vps_instances; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.vps_instances (
    id integer NOT NULL,
    user_id integer NOT NULL,
    package_id integer NOT NULL,
    instance_name character varying(255) NOT NULL,
    ipv4_address character varying(15),
    operating_system character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    stripe_subscription_id character varying(255),
    stripe_customer_id character varying(255),
    subscription_status character varying(50),
    root_password character varying(255),
    ssh_keys text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.vps_instances OWNER TO neondb_owner;

--
-- Name: vps_instances_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.vps_instances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vps_instances_id_seq OWNER TO neondb_owner;

--
-- Name: vps_instances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.vps_instances_id_seq OWNED BY public.vps_instances.id;


--
-- Name: vps_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.vps_orders (
    id integer NOT NULL,
    customer_email character varying NOT NULL,
    customer_name character varying,
    package_id integer NOT NULL,
    operating_system character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    stripe_subscription_id character varying NOT NULL,
    stripe_customer_id character varying NOT NULL,
    subscription_status character varying NOT NULL,
    package_name character varying NOT NULL,
    package_price integer NOT NULL,
    vcpu character varying NOT NULL,
    memory character varying NOT NULL,
    storage character varying NOT NULL,
    server_ip_address character varying,
    server_ssh_port integer,
    server_rdp_port integer,
    server_username character varying,
    server_password character varying,
    server_ssh_key text,
    server_notes text,
    processed_by integer,
    processed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.vps_orders OWNER TO neondb_owner;

--
-- Name: vps_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.vps_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vps_orders_id_seq OWNER TO neondb_owner;

--
-- Name: vps_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.vps_orders_id_seq OWNED BY public.vps_orders.id;


--
-- Name: vps_packages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.vps_packages (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    price integer NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    vcpu numeric(3,1) NOT NULL,
    memory integer NOT NULL,
    storage integer NOT NULL,
    additional_storage integer DEFAULT 0,
    ipv4_addresses integer DEFAULT 1 NOT NULL,
    traffic_port character varying(50) NOT NULL,
    os_choices text NOT NULL,
    is_anonymous boolean DEFAULT true,
    stripe_price_id character varying(255),
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.vps_packages OWNER TO neondb_owner;

--
-- Name: vps_packages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.vps_packages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vps_packages_id_seq OWNER TO neondb_owner;

--
-- Name: vps_packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.vps_packages_id_seq OWNED BY public.vps_packages.id;


--
-- Name: api_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_settings ALTER COLUMN id SET DEFAULT nextval('public.api_settings_id_seq'::regclass);


--
-- Name: custom_header_code id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.custom_header_code ALTER COLUMN id SET DEFAULT nextval('public.custom_header_code_id_seq'::regclass);


--
-- Name: device_fingerprints id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.device_fingerprints ALTER COLUMN id SET DEFAULT nextval('public.device_fingerprints_id_seq'::regclass);


--
-- Name: domain_search_cache id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.domain_search_cache ALTER COLUMN id SET DEFAULT nextval('public.domain_search_cache_id_seq'::regclass);


--
-- Name: donations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.donations ALTER COLUMN id SET DEFAULT nextval('public.donations_id_seq'::regclass);


--
-- Name: facebook_pixel_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.facebook_pixel_settings ALTER COLUMN id SET DEFAULT nextval('public.facebook_pixel_settings_id_seq'::regclass);


--
-- Name: hosting_accounts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.hosting_accounts ALTER COLUMN id SET DEFAULT nextval('public.hosting_accounts_id_seq'::regclass);


--
-- Name: hosting_packages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.hosting_packages ALTER COLUMN id SET DEFAULT nextval('public.hosting_packages_id_seq'::regclass);


--
-- Name: package_usage id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.package_usage ALTER COLUMN id SET DEFAULT nextval('public.package_usage_id_seq'::regclass);


--
-- Name: pending_orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pending_orders ALTER COLUMN id SET DEFAULT nextval('public.pending_orders_id_seq'::regclass);


--
-- Name: plugin_downloads id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_downloads ALTER COLUMN id SET DEFAULT nextval('public.plugin_downloads_id_seq'::regclass);


--
-- Name: plugin_requests id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_requests ALTER COLUMN id SET DEFAULT nextval('public.plugin_requests_id_seq'::regclass);


--
-- Name: plugins id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugins ALTER COLUMN id SET DEFAULT nextval('public.plugins_id_seq'::regclass);


--
-- Name: premium_hosting_orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.premium_hosting_orders ALTER COLUMN id SET DEFAULT nextval('public.premium_hosting_orders_id_seq'::regclass);


--
-- Name: smtp_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.smtp_settings ALTER COLUMN id SET DEFAULT nextval('public.smtp_settings_id_seq'::regclass);


--
-- Name: stripe_settings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stripe_settings ALTER COLUMN id SET DEFAULT nextval('public.stripe_settings_id_seq'::regclass);


--
-- Name: user_groups id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_groups ALTER COLUMN id SET DEFAULT nextval('public.user_groups_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: vps_instances id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vps_instances ALTER COLUMN id SET DEFAULT nextval('public.vps_instances_id_seq'::regclass);


--
-- Name: vps_orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vps_orders ALTER COLUMN id SET DEFAULT nextval('public.vps_orders_id_seq'::regclass);


--
-- Name: vps_packages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vps_packages ALTER COLUMN id SET DEFAULT nextval('public.vps_packages_id_seq'::regclass);


--
-- Data for Name: api_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.api_settings (id, whm_api_url, whm_api_token, cpanel_base_url, email_from_address, email_from_name, is_active, created_at, updated_at) FROM stdin;
2	https://cpanel3.openweb.co.za:2087/json-api/	T8UD113O3YTV1FZV6O3LYR077V6FKP26	https://cpanel3.openweb.co.za:2083	support@hostfarm.org	HostFarm.org	f	2025-06-30 14:56:27.365651	2025-06-30 14:56:27.357
3	https://cpanel3.openweb.co.za:2087	T8UD113O3YTV1FZV6O3LYR077V6FKP26	https://cpanel3.openweb.co.za:2083	support@hostfarm.org	HostFarm.org	f	2025-06-30 14:56:41.520545	2025-06-30 14:56:41.51
4	https://cpanel3.openweb.co.za:2087/json-api/	T8UD113O3YTV1FZV6O3LYR077V6FKP26	https://cpanel3.openweb.co.za	support@hostfarm.org	HostFarm.org	f	2025-06-30 15:00:28.105945	2025-06-30 15:00:28.098
1	https://cpanel3.openweb.co.za:2087/json-api/	T8UD113O3YTV1FZV6O3LYR077V6FKP26	https://cpanel3.openweb.co.za	support@hostfarm.org	HostFarm.org	f	2025-06-30 14:39:06.525237	2025-06-30 17:08:04.388196
5	https://cpanel3.openweb.co.za:2087/json-api/	T8UD113O3YTV1FZV6O3LYR077V6FKP26	https://cpanel3.openweb.co.za	support@hostfarm.org	HostFarm.org	t	2025-07-01 12:56:01.058777	2025-07-01 12:56:01.05
\.


--
-- Data for Name: custom_header_code; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.custom_header_code (id, name, code, is_active, "position", created_at, updated_at) FROM stdin;
1	Facebook Pixel	<!-- Meta Pixel Code -->\n<script>\n!function(f,b,e,v,n,t,s)\n{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};\nif(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\nn.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];\ns.parentNode.insertBefore(t,s)}(window, document,'script',\n'https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', '354921090722288');\nfbq('track', 'PageView');\n</script>\n<noscript><img height="1" width="1" style="display:none"\nsrc="https://www.facebook.com/tr?id=354921090722288&ev=PageView&noscript=1"\n/></noscript>\n<!-- End Meta Pixel Code -->	t	1	2025-07-06 14:52:47.473378	2025-07-06 14:52:47.473378
\.


--
-- Data for Name: device_fingerprints; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.device_fingerprints (id, user_id, fingerprint_hash, mac_address, user_agent, screen_resolution, timezone, language, platform_info, ip_address, last_seen, created_at, canvas_fingerprint, webgl_fingerprint, audio_fingerprint) FROM stdin;
\.


--
-- Data for Name: domain_search_cache; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.domain_search_cache (id, domain, "isAvailable", "lastChecked", "expiresAt", "searchSource", "searchResults", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.donations (id, user_id, amount, currency, status, payment_method, donor_email, message, created_at, stripe_subscription_id, stripe_customer_id, is_recurring, subscription_status, gift_tier, gift_type, gift_details, stripe_payment_intent_id, plugin_id, plugin_name) FROM stdin;
1	\N	500	USD	pending	stripe	\N	\N	2025-07-04 15:01:08.712272	sub_1RhB6rRxDoUeGEPbwbYFV8V8	cus_ScPw4ao7GXMpqC	t	incomplete	$5	vps	{"cpu":1,"ram":1,"storage":40,"ipv4":1,"os":["Ubuntu 22.04","Debian 12"]}	\N	\N	\N
2	\N	1000	USD	pending	stripe	\N	\N	2025-07-06 15:07:18.849258	sub_1Rhu9xRxDoUeGEPbQu5TuZru	cus_SdAU0zA9Kiv6H1	t	incomplete	$10	hosting	{"storage":"50GB","domain":".im Domain Included","bandwidth":"Unlimited","databases":"Unlimited MySQL","emails":"Unlimited Email Accounts","support":"Premium Support"}	\N	\N	\N
\.


--
-- Data for Name: facebook_pixel_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.facebook_pixel_settings (id, pixel_id, access_token, is_active, track_page_views, track_purchases, purchase_event_value, test_mode, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hosting_accounts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.hosting_accounts (id, user_id, domain, subdomain, status, disk_usage, disk_limit, bandwidth_used, bandwidth_limit, created_at, updated_at, package_id, cpanel_username, cpanel_password, whm_account_id) FROM stdin;
53	51	vagrant.hostme.today	vagrant	active	0	512	0	102400	2025-07-09 21:04:23.96309	2025-07-09 21:04:39.576	1	vagrant	.f28lihhg8ts8RL9	\N
54	52	Mortgage.hostme.today	Mortgage	active	0	512	0	102400	2025-07-09 21:56:07.395234	2025-07-09 21:56:07.395234	1	mortgage	0.oizaivsu3e1I9U	\N
47	43	aslisona.hostme.today	aslisona	active	0	5120	0	10240	2025-07-09 19:38:06.138689	2025-07-09 19:38:06.138689	1	\N	\N	\N
56	53	mortgagecanada.hostme.today	mortgagecanada	active	0	5120	0	10240	2025-07-09 22:00:55.841088	2025-07-09 22:00:55.841088	1	\N	\N	\N
59	57	spider7.hostme.today	spider7	active	0	512	0	102400	2025-07-09 22:29:22.922704	2025-07-09 22:29:22.922704	1	spider7	0.y2eo3vrrh91PVJ	\N
60	58	spider8.hostme.today	spider8	active	0	512	0	102400	2025-07-09 22:30:18.653546	2025-07-09 22:30:18.653546	1	spider8	.76dca01han7INNQ	\N
32	22	applepie2.hostme.today	applepie2	active	0	512	0	102400	2025-07-05 16:53:54.873819	2025-07-06 13:32:01.241	1	applepie2	.6d3q4uqr6uiRVUA	\N
33	25	Ind.hostme.today	Ind	active	0	5120	0	10240	2025-07-09 15:40:38.897853	2025-07-09 15:40:38.897853	1	\N	\N	\N
48	45	Walazy.hostme.today	Walazy	active	0	512	0	102400	2025-07-09 20:10:04.535067	2025-07-09 20:10:04.535067	1	walazy	.bcwa7kiedapOM1P	\N
34	27	452562.hostme.today	452562	active	0	512	0	102400	2025-07-09 16:53:54.456126	2025-07-09 16:58:51.127	1	h452562	0.ifn8486olg02MD	\N
35	31	NehaSharma.hostme.today	NehaSharma	active	0	512	0	102400	2025-07-09 17:34:11.87651	2025-07-09 17:34:11.87651	1	nehasharma	0.my4lqhd5i4S5T2	\N
36	32	mywpsite.hostme.today	mywpsite	active	0	512	0	102400	2025-07-09 17:55:05.810665	2025-07-09 17:55:05.810665	1	mywpsite	0.uzniqhed0mHA33	\N
38	34	Dbv.hostme.today	Dbv	active	0	512	0	102400	2025-07-09 18:35:39.352297	2025-07-09 18:35:39.352297	1	dbv	.khtarqgpe1oVNHS	\N
39	35	Nyppfnc.hostme.today	Nyppfnc	active	0	512	0	102400	2025-07-09 18:36:03.699	2025-07-09 18:36:03.699	1	nyppfnc	.5jvkbt7040iGPZD	\N
40	36	tesing.hostme.today	tesing	active	0	5120	0	10240	2025-07-09 18:38:23.823384	2025-07-09 18:38:23.823384	1	\N	\N	\N
61	59	Hawkwear.hostme.today	Hawkwear	active	0	5120	0	10240	2025-07-09 22:34:22.915743	2025-07-09 22:34:22.915743	1	\N	\N	\N
45	41	nadimsiddiqui.hostme.today	nadimsiddiqui	active	0	512	0	102400	2025-07-09 19:20:45.937066	2025-07-09 23:33:22.054	1	nadimsiddiqui	.133g5ogxt4gTM9O	\N
37	33	mynewwpsite.hostme.today	mynewwpsite	active	0	512	0	102400	2025-07-09 17:56:12.599652	2025-07-09 18:50:31.623	1	mynewwpsite	0.mku6r2l6fz2GLN	\N
41	37	nowa.hostme.today	nowa	active	0	5120	0	10240	2025-07-09 19:05:23.102717	2025-07-09 19:05:23.102717	1	\N	\N	\N
42	38	Nadim.hostme.today	Nadim	active	0	512	0	102400	2025-07-09 19:16:01.12349	2025-07-09 19:16:01.12349	1	nadim	.b1wbcuwl4fg3IVH	\N
43	39	Irahulry.hostme.today	Irahulry	active	0	512	0	102400	2025-07-09 19:16:30.025531	2025-07-09 19:16:30.025531	1	irahulry	0.q6heyisd5cL7CN	\N
44	40	Jwjssja.hostme.today	Jwjssja	active	0	512	0	102400	2025-07-09 19:18:08.691104	2025-07-09 19:18:08.691104	1	jwjssja	.3wvl73qfkob6D4K	\N
50	47	grause.hostme.today	grause	active	0	512	0	102400	2025-07-09 20:53:41.050945	2025-07-09 20:53:41.050945	1	grause	0.o1rxsno9a6P6U5	\N
30	20	gooday4.hostme.today	gooday4	active	0	512	0	102400	2025-07-05 12:06:28.499706	2025-07-05 13:01:17.679	1	gooday4	.gp7bvdlqb87SQFR	\N
62	61	Ahmadraza.hostme.today	Ahmadraza	active	0	512	0	102400	2025-07-10 01:09:30.211041	2025-07-10 02:13:06.775	1	ahmadraza	0.vog4u571qy0UIR	\N
22	14	mailstart.hostme.today	mailstart	active	0	5120	0	10240	2025-07-04 15:03:17.013196	2025-07-04 15:03:17.013196	1	\N	\N	\N
67	66	5555.hostme.today	5555	active	0	512	0	102400	2025-07-10 01:50:28.558591	2025-07-10 02:00:47.734	1	h5555	.lt61avhtu89YQY1	\N
51	48	google.hostme.today	google	active	0	512	0	102400	2025-07-09 20:59:57.865112	2025-07-09 20:59:57.865112	1	google	.7hzfn04sok2KN86	\N
25	15	hello9.hostme.today	hello9	active	0	5120	0	10240	2025-07-05 10:31:04.606483	2025-07-05 10:31:10.977	1	hello9	p48NmuppA5TK	\N
23	14	hello7.hostme.today	hello7	active	0	512	0	102400	2025-07-04 17:03:11.778311	2025-07-05 11:03:21.696	1	hello7	.37wtdk1skh6	\N
24	14	hello8.hostme.today	hello8	active	0	512	0	102400	2025-07-04 17:33:07.780485	2025-07-05 11:03:24.95	1	hello8	0.y7ka1dzwjz	\N
26	16	goodday1.hostme.today	goodday1	active	0	5120	0	10240	2025-07-05 11:05:22.675522	2025-07-05 11:05:22.675522	1	\N	\N	\N
27	17	goodday2.hostme.today	goodday2	active	0	512	0	102400	2025-07-05 11:17:41.512367	2025-07-05 11:17:41.512367	1	goodday2	.4z4okgg89d87B3M	\N
28	18	fixtest999.hostme.today	fixtest999	active	0	512	0	102400	2025-07-05 11:19:31.404371	2025-07-05 11:19:31.404371	1	fixtest999	.alfw9bl7z0u1M0Q	\N
29	19	authtest789xyz.hostme.today	authtest789xyz	active	0	512	0	102400	2025-07-05 11:20:19.994221	2025-07-05 11:20:19.994221	1	authtest789xyz	.36ptsbn0li5T35P	\N
66	65	Ioo.hostme.today	Ioo	active	1048576	512	0	102400	2025-07-10 01:49:02.82631	2025-07-10 02:01:28.459	1	ioo	.oj9xcbfax4l7802	\N
55	54	Mallonee.hostme.today	Mallonee	active	0	512	0	102400	2025-07-09 22:00:16.425742	2025-07-09 22:06:09.67	1	mallonee	.sf6ekk5mfirORZP	\N
70	70	Sanjayprajapati.hostme.today	Sanjayprajapati	active	0	5120	0	10240	2025-07-10 02:11:42.924088	2025-07-10 02:11:42.924088	1	\N	\N	\N
31	21	applepie.hostme.today	applepie	active	0	512	0	102400	2025-07-05 16:47:46.285501	2025-07-05 16:53:24.114	1	applepie	.iu8zlzdx3wgOERI	\N
57	55	Gghhbb.hostme.today	Gghhbb	active	0	512	0	102400	2025-07-09 22:25:28.709205	2025-07-09 22:25:28.709205	1	gghhbb	.57ymsoxnhzo37RS	\N
63	62	Saqib.hostme.today	Saqib	active	0	512	0	102400	2025-07-10 01:32:23.660803	2025-07-10 01:34:55.249	1	saqib	0.zabk3gfqv4XMLK	\N
49	46	walzay.hostme.today	walzay	active	0	512	0	102400	2025-07-09 20:33:24.537861	2025-07-09 21:02:29.498	1	walzay	.kka114gdcdm60KH	\N
52	50	lucifer.hostme.today	lucifer	active	0	512	0	102400	2025-07-09 21:03:40.290417	2025-07-09 21:03:40.290417	1	lucifer	.rs606bale8eAIYM	\N
64	63	blog.hostme.today	blog	active	0	512	0	102400	2025-07-10 01:46:20.316587	2025-07-10 01:46:20.316587	1	blog	.tepvgnsojnn52CB	\N
58	56	Tuhgivci.hostme.today	Tuhgivci	active	0	512	0	102400	2025-07-09 22:25:48.097698	2025-07-09 22:28:31.444	1	tuhgivci	.fymmytiktqvISJU	\N
65	64	Linku.hostme.today	Linku	active	0	512	0	102400	2025-07-10 01:47:10.847566	2025-07-10 01:47:10.847566	1	linku	.xyj3bbkldpqZ7W7	\N
72	71	netflix.hostme.today	netflix	active	0	512	0	102400	2025-07-10 02:19:07.700471	2025-07-10 02:19:07.700471	1	netflix	.6w2aih3zny7T80U	\N
68	67	listing.hostme.today	listing	active	0	512	0	102400	2025-07-10 02:02:10.619228	2025-07-10 02:02:10.619228	1	listing	.d6i3uaso80i9PEP	\N
69	68	ads.hostme.today	ads	active	0	512	0	102400	2025-07-10 02:07:33.187362	2025-07-10 02:07:33.187362	1	ads	.bhcod0x1uzjYDND	\N
71	69	classifieds.hostme.today	classifieds	active	0	5120	0	10240	2025-07-10 02:11:54.889237	2025-07-10 02:11:54.889237	1	\N	\N	\N
74	73	Skyemirates.hostme.today	Skyemirates	active	0	512	0	102400	2025-07-10 02:23:17.835591	2025-07-10 02:23:17.835591	1	skyemirates	.5xryfd09s425EDG	\N
75	74	megatron.hostme.today	megatron	active	0	512	0	102400	2025-07-10 02:26:31.746628	2025-07-10 02:26:31.746628	1	megatron	.dqjob278b1f105C	\N
76	75	ShashwatGaurav.hostme.today	ShashwatGaurav	active	0	512	0	102400	2025-07-10 02:28:50.545158	2025-07-10 02:28:50.545158	1	shashwatgaurav	.ft17vsp20mw12HE	\N
73	72	Hotstar.hostme.today	Hotstar	active	0	512	0	102400	2025-07-10 02:20:17.282548	2025-07-10 02:42:58.861	1	hotstar	.a86u8ty2wihBCVN	\N
77	76	app.hostme.today	app	active	0	512	0	102400	2025-07-10 02:56:49.107948	2025-07-10 02:56:49.107948	1	app	0.z6uat4qxxoR33A	\N
78	77	rajeducationclasses.hostme.today	rajeducationclasses	active	0	512	0	102400	2025-07-10 03:17:21.614074	2025-07-10 03:17:21.614074	1	rajeducationclas	.1lv4i5hozki1WFQ	\N
101	99	Ilovepdf.hostme.today	Ilovepdf	active	0	5120	0	10240	2025-07-10 05:36:58.50844	2025-07-10 05:36:58.50844	1	\N	\N	\N
121	1	applepie3.hostme.today	applepie3	active	0	5120	0	10240	2025-07-11 14:25:28.808359	2025-07-11 14:53:53.39	1	applepie3	oza6n40oA1!	applepie3
102	101	routhugovindraju.hostme.today	routhugovindraju	active	0	512	0	102400	2025-07-10 05:50:30.301932	2025-07-10 05:50:30.301932	1	routhugovindraju	0.kgn5igpox30MPH	\N
80	79	superdosts.hostme.today	superdosts	active	0	5120	0	10240	2025-07-10 03:35:16.255602	2025-07-10 03:35:16.255602	1	\N	\N	\N
81	80	Carinfohub.hostme.today	Carinfohub	active	0	512	0	102400	2025-07-10 03:38:31.791908	2025-07-10 03:38:31.791908	1	carinfohub	.eukt7ls68d6LEXP	\N
82	81	Blogplace.hostme.today	Blogplace	active	0	512	0	102400	2025-07-10 03:39:18.727824	2025-07-10 03:39:18.727824	1	blogplace	0wc7p14tee5pDRT3	\N
83	82	Tamplab.hostme.today	Tamplab	active	0	512	0	102400	2025-07-10 03:40:47.555924	2025-07-10 03:40:47.555924	1	tamplab	0.y5gvhz7pksDV36	\N
84	24	khancable.hostme.today	khancable	active	0	5120	0	10240	2025-07-10 03:41:43.073093	2025-07-10 03:41:43.073093	1	\N	\N	\N
103	98	Bssuite.hostme.today	Bssuite	active	0	5120	0	10240	2025-07-10 05:53:27.794007	2025-07-10 05:53:27.794007	1	\N	\N	\N
110	107	Fggv.hostme.today	Fggv	active	0	5120	0	10240	2025-07-10 06:14:55.291214	2025-07-10 06:14:55.291214	1	\N	\N	\N
111	108	jayram.hostme.today	jayram	active	0	512	0	102400	2025-07-10 06:16:38.477738	2025-07-10 06:16:38.477738	1	jayram	.q07ulp12we8VD4R	\N
113	110	Sellmesocialmedia.hostme.today	Sellmesocialmedia	active	0	512	0	102400	2025-07-10 06:22:31.524392	2025-07-10 06:22:31.524392	1	Sellmesocialmedi	0.n1eh57qtg60J0Y	\N
114	111	Cardrbluser.hostme.today	Cardrbluser	active	0	512	0	102400	2025-07-10 06:27:51.007266	2025-07-10 06:27:51.007266	1	cardrbluser	.qco77by1xreBYHL	\N
112	109	jayramtg.hostme.today	jayramtg	active	0	512	0	102400	2025-07-10 06:17:52.71145	2025-07-10 08:48:11.465	1	jayramtg	.fvz56b55wyo89MI	\N
79	78	Rmcable.hostme.today	Rmcable	active	415236096	512	0	102400	2025-07-10 03:32:10.669656	2025-07-10 03:57:21.387	1	rmcable	.w61qy1ckb3l6QCB	\N
85	84	tcgaming.hostme.today	tcgaming	active	0	512	0	102400	2025-07-10 03:43:47.363729	2025-07-10 04:02:11.866	1	tcgaming	.6hwd431ythn2VMQ	\N
87	86	studentsnewsgroup.hostme.today	studentsnewsgroup	active	0	512	0	102400	2025-07-10 04:07:41.219268	2025-07-10 04:07:41.219268	1	studentsnewsgrou	.paq65xj6v09YRA8	\N
105	103	Shareef.hostme.today	Shareef	active	0	512	0	102400	2025-07-10 06:03:54.17874	2025-07-10 06:03:54.17874	1	shareef	.3gqijpz7r5eUJ5K	\N
126	121	spaceman5.hostme.today	spaceman5	active	0	5120	0	10240	2025-07-11 16:17:03.055147	2025-07-11 16:17:03.055147	1	spaceman5	JzbsIlsfUf3a	\N
88	87	Gamefluxx.hostme.today	Gamefluxx	active	0	512	0	102400	2025-07-10 04:13:05.927888	2025-07-10 04:13:05.927888	1	gamefluxx	.r12ehnr6nksNLMR	\N
86	85	Eth.hostme.today	Eth	active	0	512	0	102400	2025-07-10 03:58:43.133841	2025-07-10 04:13:07.144	1	eth	.pfsslckoxafN1VB	\N
89	88	gsmbazaar.hostme.today	gsmbazaar	active	0	512	0	102400	2025-07-10 04:13:32.567704	2025-07-10 04:13:32.567704	1	gsmbazaar	.y7wshf1ciogFMPU	\N
90	89	Gameflux.hostme.today	Gameflux	active	0	512	0	102400	2025-07-10 04:14:20.146813	2025-07-10 04:14:20.146813	1	gameflux	0.e8a6bc4acjV67L	\N
91	90	vollms.hostme.today	vollms	active	0	512	0	102400	2025-07-10 04:14:40.737485	2025-07-10 04:14:40.737485	1	vollms	.e72az0h50vdHNNA	\N
92	92	Gamesfluxx.hostme.today	Gamesfluxx	active	0	512	0	102400	2025-07-10 04:15:43.521769	2025-07-10 04:15:43.521769	1	gamesfluxx	.rijwrvuh4utIRUN	\N
93	91	gsmforum.hostme.today	gsmforum	active	0	5120	0	10240	2025-07-10 04:16:03.399932	2025-07-10 04:16:03.399932	1	\N	\N	\N
94	93	Qrmenubiz.hostme.today	Qrmenubiz	active	0	512	0	102400	2025-07-10 04:16:24.829903	2025-07-10 04:16:24.829903	1	qrmenubiz	0ce9q5rt3zqrUVBA	\N
95	94	Tapndines.hostme.today	Tapndines	active	0	5120	0	10240	2025-07-10 04:19:17.152581	2025-07-10 04:19:17.152581	1	\N	\N	\N
96	91	firmware.hostme.today	firmware	active	0	5120	0	10240	2025-07-10 04:19:22.307118	2025-07-10 04:19:22.307118	1	\N	\N	\N
127	122	spaceman6.hostme.today	spaceman6	active	0	5120	0	10240	2025-07-11 16:34:38.289167	2025-07-11 16:34:38.289167	1	spaceman6	8WZ**Ch5Al3R	\N
120	102	sreemukhi.hostme.today	sreemukhi	active	0	5120	0	10240	2025-07-11 13:05:32.463204	2025-07-11 13:05:32.463204	1	\N	\N	\N
46	42	Cooe.hostme.today	Cooe	active	479199232	512	0	102400	2025-07-09 19:30:11.498965	2025-07-10 06:06:43.76	1	cooe	.1jnxs3kr9yiJY6U	\N
106	105	shahzad.hostme.today	shahzad	active	0	512	0	102400	2025-07-10 06:06:44.935831	2025-07-10 06:06:44.935831	1	shahzad	.pze2mtu733e0I4N	\N
97	96	kskksksks.hostme.today	kskksksks	active	0	5120	0	10240	2025-07-10 05:04:21.921764	2025-07-10 05:04:21.921764	1	\N	\N	\N
98	83	alltools.hostme.today	alltools	active	0	5120	0	10240	2025-07-10 05:09:26.001425	2025-07-10 05:09:26.001425	1	\N	\N	\N
107	104	govindrajurouthu.hostme.today	govindrajurouthu	active	0	5120	0	10240	2025-07-10 06:07:25.334619	2025-07-10 06:07:25.334619	1	\N	\N	\N
108	106	gamerzone.hostme.today	gamerzone	active	0	512	0	102400	2025-07-10 06:07:41.75737	2025-07-10 06:07:41.75737	1	gamerzone	.88bf3vslamsEDYD	\N
109	107	gamer.hostme.today	gamer	active	0	5120	0	10240	2025-07-10 06:10:03.094248	2025-07-10 06:10:03.094248	1	\N	\N	\N
117	113	miracle.hostme.today	miracle	active	0	5120	0	10240	2025-07-10 13:26:36.670594	2025-07-10 13:26:36.670594	1	\N	\N	\N
116	112	mumess.hostme.today	mumess	active	0	512	0	102400	2025-07-10 12:33:56.961237	2025-07-10 13:35:28.834	1	mumess	.qw4ryjgaconO00S	\N
99	98	cablebs.hostme.today	cablebs	active	0	5120	0	10240	2025-07-10 05:27:04.828379	2025-07-10 05:27:04.828379	1	\N	\N	\N
100	99	Webtool.hostme.today	Webtool	active	0	5120	0	10240	2025-07-10 05:33:27.262167	2025-07-10 05:33:27.262167	1	\N	\N	\N
115	30	4555441.hostme.today	4555441	active	0	5120	0	10240	2025-07-10 09:45:36.739656	2025-07-10 09:45:36.739656	1	h4555441	TempPassword123!	\N
128	123	spaceman7.hostme.today	spaceman7	active	0	5120	0	10240	2025-07-11 16:41:12.558201	2025-07-11 16:41:12.558201	1	spaceman7	tEx5dYKwDSff	\N
119	110	Priyankasarkar10yt.hostme.today	Priyankasarkar10yt	active	0	5120	0	10240	2025-07-10 15:19:57.45544	2025-07-10 15:19:57.45544	1	\N	\N	\N
129	124	spaceman8.hostme.today	spaceman8	active	0	5120	0	10240	2025-07-11 16:45:22.334875	2025-07-11 16:45:22.334875	1	spaceman8	1z&r3*Z7Byl%	\N
104	102	amazesree.hostme.today	amazesree	active	3145728	512	0	102400	2025-07-10 05:58:44.101036	2025-07-11 13:17:27.506	1	amazesree	.gmhanwy0xqc03VR	\N
130	125	sahaniji.hostme.today	sahaniji	active	0	5120	0	10240	2025-07-11 17:40:11.355015	2025-07-11 17:40:11.355015	1	sahaniji	wMyj0B5KgWNw	\N
118	114	anon.hostme.today	anon	active	0	5120	0	10240	2025-07-10 14:50:38.201906	2025-07-10 14:50:38.201906	1	\N	\N	\N
131	126	spaceman9.hostme.today	spaceman9	active	0	5120	0	10240	2025-07-11 18:01:25.438551	2025-07-11 18:01:25.438551	1	spaceman9	Yx!vOtBN7rIp	\N
132	127	spaceman10.hostme.today	spaceman10	active	0	5120	0	10240	2025-07-11 18:10:16.115739	2025-07-11 18:10:16.115739	1	spaceman10	X09Psk2&c#*%	\N
133	128	hencloud.hostme.today	hencloud	active	0	5120	0	10240	2025-07-11 21:52:50.635604	2025-07-11 21:52:50.635604	1	hencloud	C1xDb9#Qi#%c	\N
134	129	poker.hostme.today	poker	active	0	5120	0	10240	2025-07-11 23:52:25.902048	2025-07-11 23:52:25.902048	1	poker	##Ga!qC2vxZp	\N
\.


--
-- Data for Name: hosting_packages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.hosting_packages (id, name, display_name, description, price, currency, disk_space_quota, bandwidth_quota, email_accounts, databases, subdomains, whm_package_name, is_active, is_free, created_at, updated_at) FROM stdin;
3	vps-3	VPS 3	Perfect for small websites and personal projects who want to host their own domain	300	USD	5120	102400	10	3	5	5GB-Paid	t	f	2025-07-09 15:16:28.179449	2025-07-09 15:39:26.229
1	free-starter	Free Starter	Perfect for small websites and personal projects	0	USD	512	102400	1	1	1	512MB Free Hosting	t	t	2025-06-30 16:17:44.528397	2025-07-11 18:09:47.797
\.


--
-- Data for Name: package_usage; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.package_usage (id, hosting_account_id, disk_used, bandwidth_used, email_accounts_used, databases_used, subdomains_used, last_updated, created_at) FROM stdin;
\.


--
-- Data for Name: pending_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pending_orders (id, "orderType", "orderId", "customerEmail", "customerName", status, "orderDetails", "totalPrice", currency, "processedBy", "processedAt", "rejectionReason", "adminNotes", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: plugin_downloads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.plugin_downloads (id, plugin_id, user_id, downloaded_at) FROM stdin;
1	1	2	2025-07-01 16:16:44.974023
2	1	36	2025-07-09 18:37:37.500097
3	1	36	2025-07-09 18:37:58.009168
4	1	36	2025-07-09 18:38:00.445045
5	4	36	2025-07-09 18:38:01.530962
6	2	36	2025-07-09 18:38:02.831874
7	2	36	2025-07-09 18:38:03.94924
8	1	37	2025-07-09 19:03:57.13711
9	1	37	2025-07-09 19:04:12.206121
10	3	44	2025-07-09 19:58:23.532013
11	2	44	2025-07-09 19:58:43.213169
12	4	49	2025-07-09 21:02:55.041899
13	2	53	2025-07-09 21:59:31.95525
14	3	53	2025-07-09 21:59:48.037973
15	2	60	2025-07-10 01:05:36.696351
16	2	60	2025-07-10 01:05:42.658973
17	4	60	2025-07-10 01:05:58.393899
18	2	60	2025-07-10 01:06:12.791748
19	2	79	2025-07-10 03:33:35.989899
20	5	94	2025-07-10 04:18:30.893125
21	1	94	2025-07-10 04:24:07.21918
22	2	83	2025-07-10 05:04:29.52946
23	1	83	2025-07-10 05:04:46.638577
24	2	83	2025-07-10 05:06:03.928477
25	4	83	2025-07-10 05:06:18.157598
26	2	83	2025-07-10 05:08:02.207217
27	1	83	2025-07-10 05:08:16.852702
28	2	83	2025-07-10 05:28:40.003466
29	5	100	2025-07-10 05:36:39.892833
30	2	99	2025-07-10 05:44:15.997545
31	1	99	2025-07-10 05:44:38.491595
32	4	99	2025-07-10 05:44:41.621443
33	2	107	2025-07-10 06:13:11.210976
34	2	107	2025-07-10 06:13:17.130821
35	1	107	2025-07-10 06:13:23.565936
36	3	110	2025-07-10 06:24:33.307775
37	2	95	2025-07-10 07:24:05.012996
38	2	95	2025-07-10 07:24:37.938703
39	2	95	2025-07-10 08:17:15.040507
40	2	83	2025-07-10 11:44:51.558609
41	1	114	2025-07-10 14:47:16.619834
42	1	114	2025-07-10 14:47:55.07766
43	1	114	2025-07-10 14:48:30.255518
44	1	114	2025-07-10 14:49:52.03254
45	2	124	2025-07-11 16:54:13.28855
46	1	124	2025-07-11 16:54:20.855902
47	2	124	2025-07-11 16:57:17.097749
48	2	124	2025-07-11 16:57:18.449738
49	2	124	2025-07-11 16:57:19.886283
50	4	129	2025-07-12 00:03:27.933721
51	4	129	2025-07-12 00:03:28.453161
\.


--
-- Data for Name: plugin_requests; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.plugin_requests (id, user_id, first_name, last_name, email, plugin_name, status, created_at) FROM stdin;
1	44	Ali	Hamza	ah0481637@gmail.com	Ali Hamza	pending	2025-07-09 19:58:10.013367
2	60	Ubaid	Raza	ubaidraza9199@gmail.com	Ceo	pending	2025-07-10 01:07:12.499875
3	24	Shadab	Akhtar	khans9304@gmail.com	Xstore	pending	2025-07-10 04:57:35.718144
\.


--
-- Data for Name: plugins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.plugins (id, name, slug, description, category, version, author, file_name, file_size, download_count, image_url, is_active, uploaded_by, created_at, updated_at, file_path, is_public) FROM stdin;
1	Rank Math Pro	rank-math-pro	Rank Math Pro is an advanced WordPress SEO plugin designed to give website owners, marketers, and agencies an all-in-one tool for optimizing their search engine performance. It builds upon the free Rank Math plugin by adding a wide array of premium features aimed at improving rankings, streamlining SEO workflows, and providing in-depth data to guide content strategies.\r\n\r\nCore Features\r\n✅ Advanced Analytics and Rank Tracking\r\nRank Math Pro integrates deeply with Google Analytics and Search Console, bringing keyword tracking, traffic data, and page-level performance insights directly into the WordPress dashboard. This lets you monitor impressions, clicks, keyword positions, and CTR in a streamlined way.\r\n\r\n✅ Powerful Schema Generator\r\nIt supports a wide range of schema types, such as FAQs, recipes, product reviews, events, and job postings. The Pro version allows importing existing schema from other sites, creating advanced schema templates, and applying conditional logic to manage schema dynamically.\r\n\r\n✅ Search Intent Insights\r\nRank Math Pro includes a feature that identifies whether your focus keyword is navigational, informational, or transactional. This helps you better tailor your content to match what users are actually searching for.\r\n\r\n✅ Content AI Assistant\r\nAn optional add-on, Content AI, integrates with Rank Math Pro to offer real-time keyword ideas, heading recommendations, related topics, and suggestions for improving your on-page SEO and internal linking structure.\r\n\r\n✅ Priority Support & Setup Wizard\r\nPro customers benefit from priority support and a guided setup wizard that makes configuring advanced SEO options simple, even for those without technical knowledge.\r\n\r\n✅ Advanced Local SEO\r\nRank Math Pro supports detailed local SEO configurations, including multiple business locations, opening hours, contact details, and geocoordinates, helping you dominate local searches.\r\n\r\n✅ WooCommerce SEO\r\nIf you run an online store, Rank Math Pro includes specialized WooCommerce SEO tools to optimize product schema, rich snippets, product metadata, and product category pages.\r\n\r\n✅ Powerful Redirection Manager\r\nThe Pro plugin provides advanced redirect handling, with options for 301, 302, 307, 410, and 451 redirects, plus 404 monitoring, which helps catch and fix broken links before they affect your rankings.\r\n\r\n✅ Deep Integrations\r\nRank Math Pro works seamlessly with page builders like Elementor, Divi, and WPBakery, and supports translation plugins such as WPML and Polylang. It is also compatible with bbPress, BuddyPress, AMP, and multisite WordPress setups.\r\n\r\n✅ Performance & Modularity\r\nIt is built with a modular architecture, meaning you can selectively activate or deactivate features as needed to keep your WordPress site lightweight and fast.\r\n\r\n✅ Other Notable Features\r\n\r\nInternal link suggestions\r\n\r\nBreadcrumbs optimization\r\n\r\nCustom RSS feeds\r\n\r\nImage SEO enhancements (like automatic alt tag generation)\r\n\r\nXML sitemap customization\r\n\r\nRole Manager for controlling access\r\n\r\nOverall, Rank Math Pro is designed to consolidate and automate many SEO tasks that previously required multiple separate plugins. Its balance of advanced features, ease of use, and robust reporting makes it a popular choice for serious website owners, agencies, and e-commerce businesses who want to manage SEO directly from WordPress with greater power and flexibility.	seo	3.0.90	HostFarm.org	1751382623522-GCQG8FzXZWqV-seo-by-rank-math-pro-3.0.90.zip	1962986	21	/api/plugins/image/1751382625249-RankMathpro.jpg	t	1	2025-07-01 15:10:25.265421	2025-07-01 15:10:25.265421	plugins/1751382623522-GCQG8FzXZWqV-seo-by-rank-math-pro-3.0.90.zip	t
2	Elementor Page Builder Pro - UNZIP FIRST	elementor-page-builder-pro-unzip-first	Elementor Pro is a premium version of the popular Elementor plugin for WordPress, designed to provide advanced tools for building highly customized, professional-quality websites using a visual, drag-and-drop interface. While the free version already offers powerful page-building capabilities, Elementor Pro unlocks a rich set of features aimed at designers, developers, and marketers who want full creative freedom and advanced functionality.	page-builder	3.30.0	HostFarm.org	1751722214489-Zoagm3VpXFWF-Elementor-Pro-3.30.0-UNZIP-FIRST.zip	25290850	42	/api/plugins/image/1751722215676-maxresdefault__1_.jpg	t	15	2025-07-05 13:30:15.689858	2025-07-05 13:30:15.689858	plugins/1751722214489-Zoagm3VpXFWF-Elementor-Pro-3.30.0-UNZIP-FIRST.zip	t
4	Yoast SEO Premium - UNZIP FIRST	yoast-seo-premium-unzip-first	Yoast SEO Premium is the enhanced, paid version of the popular Yoast SEO plugin for WordPress, designed to help website owners, bloggers, and businesses optimize their sites more effectively. It builds on the free version by offering advanced tools and automation that make SEO easier, more intuitive, and more powerful.	seo	25.4	HostFarm.org	1751990493614-cjIVT15wWTNs-Yoast-SEO-Premium-25.4-UNZIP-FIRST.zip	5828903	7	/api/plugins/image/1751990495951-images__1_.png	t	15	2025-07-08 16:01:35.964558	2025-07-08 16:01:35.964558	plugins/1751990493614-cjIVT15wWTNs-Yoast-SEO-Premium-25.4-UNZIP-FIRST.zip	f
5	WP Mail SMTP Pro	wp-mail-smtp-pro	WP Mail SMTP Pro is a premium WordPress plugin that ensures site-generated emails reliably reach inboxes by rerouting them through authenticated SMTP services instead of the default PHP mail function. It’s trusted by millions of websites to overcome common email deliverability issues.	e-commerce	4.5.0	HostFarm.org	1752069180282-7s1TAFyVfZhe-wp-mail-smtp-pro-4.5.0.zip	4138051	2	/api/plugins/image/1752069182561-ChatGPT_Image_Jul_9__2025__03_52_48_PM.png	t	15	2025-07-09 13:53:02.601122	2025-07-09 13:53:02.601122	plugins/1752069180282-7s1TAFyVfZhe-wp-mail-smtp-pro-4.5.0.zip	f
3	WPFunnels Pro 	wpfunnels-pro	WPFunnels Pro is a powerful, visual funnel builder plugin for WordPress and WooCommerce. It provides a drag-and-drop canvas to design and manage complete sales funnels—landing pages, checkout flows, upsells, downsells, and thank-you pages—all within your WordPress dashboard. It’s tailored for digital creators, course sellers, e-commerce businesses, and marketers seeking a comprehensive funnel solution.	analytics	2.5.11	HostFarm.org	1751989577053-BEBqz5lFW92I-wpfunnels-pro-2.5.11Addons.zip	3726727	3	/api/plugins/image/1751989578503-images.png	t	15	2025-07-08 15:46:18.518742	2025-07-08 15:46:18.518742	plugins/1751989577053-BEBqz5lFW92I-wpfunnels-pro-2.5.11Addons.zip	f
\.


--
-- Data for Name: premium_hosting_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.premium_hosting_orders (id, "customerEmail", "customerName", "domainName", "orderType", status, "domainPrice", "finalPrice", "profitMargin", "stripePaymentIntentId", "stripeCustomerId", "paymentStatus", "externalOrderId", "externalStatus", "processedBy", "processedAt", "cpanelUsername", "cpanelPassword", "cpanelUrl", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
aj38HxEoMJ9oheBtR_IzIrzd83pyHiwA	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T01:50:29.003Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":66}}	2025-07-17 02:00:48
YLYq864P-NsEQ5fuPVP5RKQQgDOGPrlD	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T01:09:30.693Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":61}}	2025-07-17 02:13:07
GlO-oRcCBagaCeoHB3x8mkrRH0m0EZ2a	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:17:03.373Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":{"id":121,"username":"my40619","email":"admin@spaceman5.hostme.today","password":"W4jf6IKcf3bm","displayPassword":"W4jf6IKcf3bm","firstName":"Anonymous","lastName":"User","profileImageUrl":null,"recoveryPhrase":"apple-jungle-jungle-jungle","isAnonymous":true,"role":"client","userGroupId":null,"createdAt":"2025-07-11T16:17:03.017Z","updatedAt":"2025-07-11T16:17:03.017Z"}}}	2025-07-18 16:17:04
NB3ik8uPKPvprs04R7to-6Td7DDAq0dq	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T01:49:03.350Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":65}}	2025-07-17 13:15:42
speos0NwNmXBFjgVEhWNk6W7NVZ4XFXe	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T06:22:31.973Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":110}}	2025-07-17 17:17:57
gL0HAT-PhrQvSfCOkhM6kkl350yCSlla	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T04:07:41.696Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":86}}	2025-07-17 04:07:50
SwckdNU4LxQ3vIL0KQEu-9_46xJuGwrI	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T22:33:32.305Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":59}}	2025-07-16 22:34:27
KO1w1c5hVq6pJ-PGSUs6C7Yp7wh6YYdc	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T05:03:31.324Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":96}}	2025-07-18 05:25:03
HjEp60GuouuaDObFfP9QEImpcvM30Ou3	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T20:53:41.520Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":47}}	2025-07-16 20:55:06
cysDOv-DBRluGdN3dEtTyuEJbFo4fe4p	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T06:16:38.929Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":108}}	2025-07-17 06:17:01
slXsT8zwJHwCaQ8NHo_P0AlM8bkWS270	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-10T14:17:01.450Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-07-16 01:35:39
jurU0NsUFGcB-1YP9pvOEMyQ8ACapBuj	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T17:34:12.397Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":31}}	2025-07-16 17:34:44
MiKlDggR6vXfmsFQw7i6PQblZgIaUwm8	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-12T11:20:20.180Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":19}}	2025-07-12 11:20:35
MPbY_AUq8-8ipePGJpqwW75z85IqCujz	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T18:37:17.356Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":36}}	2025-07-16 18:39:21
8W03lwAwssQTJsfiSZVHzWYOElPbBlKz	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T19:20:46.106Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":41}}	2025-07-16 23:33:23
bHDE43BnlzqMFwfpUmCX6whQhYqF-8lt	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T21:04:24.138Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":51}}	2025-07-16 21:04:40
5oSVlVgTD6YNCa6G8Q2s9tu5AkcnrRib	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T19:18:09.145Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":40}}	2025-07-16 19:19:18
GwQg66oGPHRxC2qd20D0ivuRUIGeMLza	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T19:16:30.481Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":39}}	2025-07-16 19:19:22
MEbqT3Cqqrc8mkx0y5f6sDaZchqM6qnq	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T22:00:16.591Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":54}}	2025-07-16 22:06:47
pXH2i9z7MvUqlOjv0D6tyMfckCvL9maQ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-12T01:58:30.993Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":11}}	2025-07-16 02:32:06
k_-mM2hJWFftlxLHN-WfgJxKEwVCcsn_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T17:56:12.783Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":33}}	2025-07-16 18:50:34
xmXCSsK8rlpr6TaujBcmOOf4Q-11SQHJ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-11T04:37:37.420Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":11}}	2025-07-16 14:39:44
Vv6lHiW9Ypw_hoSL9sICufiMet9jH6Dy	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T20:10:05.051Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":45}}	2025-07-16 20:10:13
HzGedGu4MAL0MKYJrzgYJKfxneaK3Fak	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T18:36:03.904Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":35}}	2025-07-16 18:36:12
uvLbCHYfSjtvn7Evm2euDy_YFNDOia6p	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T02:10:30.406Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":69}}	2025-07-17 02:25:19
UkL6syx1okkEd-SznVy9Eho12tu8Yytm	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T19:57:08.334Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":44}}	2025-07-16 20:02:18
SOWtkrGp7qjfVL6VP8dwzSqvLXo-ik0Q	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T01:04:54.605Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":60}}	2025-07-17 01:07:30
GhSZsYbg76M2QWJnU0BtLyGcweYugIjR	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T19:03:27.649Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":37}}	2025-07-16 19:06:13
9J5J-5-fyhA_-ROIHlYZQL7RdS7nJwis	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T19:36:36.730Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":43}}	2025-07-16 19:38:34
rQcQJpbY4gX821-qkrJ9S0lQzWKFeKF1	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T22:25:48.268Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":56}}	2025-07-16 22:28:53
zWNSygZRKCDkiQrlV08D6a51W39wRGz0	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T15:31:27.299Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":25}}	2025-07-16 19:16:05
uEcpE_J8-AV6eUxfFMu_0D6ietv_LvGw	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T20:33:25.075Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":46}}	2025-07-16 21:02:30
p2uFAGCIzyDPr9lHovGb2cvfnO5GyxbL	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T22:30:18.819Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":58}}	2025-07-16 22:30:27
mo77JcnqVazNuU28fTEqVO_FUmiVz9KW	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T01:32:24.133Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":62}}	2025-07-17 01:35:10
ynKaDbZMOgWriZIlyyzmATRjK-L7IUFV	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:50:01.714Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 16:50:02
G0KVFEaaHWiaHZ1y-9ZslIOpe1viSFgK	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T03:40:48.019Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":82}}	2025-07-17 03:41:41
0zx5ugHFVl557YY_ILR7DTOh5IB105iK	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T03:43:47.802Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":84}}	2025-07-17 04:02:48
yNWCNL0x8M1aPtrgqIptYwaYIkkJNzdM	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T06:17:53.162Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":109}}	2025-07-17 08:48:12
OD4SJw7LecNz0GsD72G4t5A4ghmpzaCU	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:53:04.889Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 16:53:05
6kKsCAZM7cCXZxzoWSH5Pqoe_U10tfgf	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T06:27:51.485Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":111}}	2025-07-17 06:29:59
FzhuPleIVVF2BrZjdgq_Quhc1TaA83sy	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T21:02:32.077Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":49}}	2025-07-17 15:09:03
nXtvHnyLADdHZI9WANvHwVD8mmihq62n	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:08:10.673Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:08:11
1bToLRr5dYUqrxPJ9GGydTAaRx969dvv	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T23:57:31.331Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 23:57:32
tCH9OiGXXKdF8oD6W_tiXT9FQO5VLBOf	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T02:26:32.199Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":74}}	2025-07-17 02:49:39
HlwvSe-sR29vo4rLp4htlIct0hnVUbeH	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T04:12:31.483Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":85}}	2025-07-17 04:13:14
iMx_iuFdNeTdyOMNr7_4WBpBev2cGNAX	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T03:41:03.526Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":83}}	2025-07-17 03:42:38
5YAfEZPSfU9cn2TFzt54e49pmK5pWjAy	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T02:23:18.282Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":73}}	2025-07-17 02:23:27
FgtVu8Vi1I_iQThtCQvMvdTT66ANPbP9	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T03:51:11.151Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":83}}	2025-07-17 11:58:28
xYUH9bZX6X6T4Iny5HQw6pMpCazVzrwJ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T02:20:17.453Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":72}}	2025-07-17 02:43:01
6Qh-KW_TVrJWFlPxK9gqmsMZxNUF7Shn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T06:06:45.107Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":105}}	2025-07-17 06:08:50
QKXFViwHupeOi7intn2xwKz46ix9YUIR	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T02:56:49.571Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":76}}	2025-07-17 02:57:19
kedcW_hZuf2vht_tpkl5feXp9WKlkSnN	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T05:35:40.685Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":99}}	2025-07-17 05:45:26
9IjY0VN12vAiI43bFqNUHlNrwx_2h01l	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T03:17:22.064Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":77}}	2025-07-17 03:18:30
ZUa61EseYXzwiL_VjjcQj-49WlPx_Q4V	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T03:39:19.167Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":81}}	2025-07-17 03:39:39
DqbPUBMsunz95DOtJcHyUNLGfHEmk8nn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T04:21:25.900Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":94}}	2025-07-17 04:24:44
6IvDF0999hCHwjFjMjWE8VW9T11hd4cp	{"cookie":{"originalMaxAge":604799999,"expires":"2025-07-17T02:28:51.032Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":75}}	2025-07-17 03:39:58
f2s1gEo5DcfbWfSD72QL_dj5V38UuP83	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T03:32:11.152Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":78}}	2025-07-17 03:57:22
Ju9-TfEWGhgx-4t7KfN76frBctg5sVb5	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T04:22:55.609Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":91}}	2025-07-17 04:23:56
bhO1_ufmDOkFTalHnm8CYakf-bMOJc_X	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T16:50:20.615Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":70}}	2025-07-17 16:54:25
Qa0thVkUY0Q-CbwZZHJA0gH0dzu2jSOl	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T06:03:54.625Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":103}}	2025-07-17 06:04:04
U4Orea0YiZGfIEPISJVB4OigJicHkTWX	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T04:30:33.132Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":95}}	2025-07-18 06:58:46
acPKB-d-iuxF3E8ppZjpwtQgY78R2C30	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-16T21:59:10.021Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":53}}	2025-07-17 19:58:07
aoGo5QhR4gv3Z3dLexXlxIYHXGj150qq	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T04:18:10.942Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":94}}	2025-07-17 04:25:07
16HHTuznRqa1xhbhSKV_A-fcnNV30OCk	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T05:24:29.539Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":97}}	2025-07-17 05:25:24
I5uLlFD3NxAL8u56S5OD3ZLVSKx9DXYr	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T03:58:43.603Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":85}}	2025-07-17 03:59:26
VK4qCwkP9QVMta49aDEEka6m6Ar-8-7J	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T05:34:33.268Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":100}}	2025-07-17 05:36:41
SzYmTMqLzoR7R44jigzmA40kL7t-TIzr	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T04:15:43.685Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":92}}	2025-07-17 04:16:15
2TRlELt1F7K9MJrEEUgEZdb1-Z2Q-GA0	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T06:06:06.938Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":104}}	2025-07-17 06:14:57
dJiORePLjsAVHsbERChp_bt-bkCCgx7J	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T03:32:58.930Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":79}}	2025-07-17 04:21:03
5MoxCGOvRBm0VAuJBgGaViiqi8nWq4LJ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:02:23.306Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:02:24
y4In-0xLR8GdtxNmiDzN7cS1S0uOmrsl	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:34:38.557Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":{"id":122,"username":"my10403","email":"admin@spaceman6.hostme.today","password":"Q4I^2kW!q$uh","displayPassword":"Q4I^2kW!q$uh","firstName":"Anonymous","lastName":"User","profileImageUrl":null,"recoveryPhrase":"jungle-dragon-forest-jungle","isAnonymous":true,"role":"client","userGroupId":null,"createdAt":"2025-07-11T16:34:38.253Z","updatedAt":"2025-07-11T16:34:38.253Z"}}}	2025-07-18 16:34:39
AhTgy_3aG6jOiWB0J8kfXGSt7Ezgv5bo	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:41:12.767Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":{"id":123,"username":"site76096","email":"admin@spaceman7.hostme.today","password":"^1F%MIKk77aw","displayPassword":"^1F%MIKk77aw","firstName":"Anonymous","lastName":"User","profileImageUrl":null,"recoveryPhrase":"eagle-jungle-garden-eagle","isAnonymous":true,"role":"client","userGroupId":null,"createdAt":"2025-07-11T16:41:12.516Z","updatedAt":"2025-07-11T16:41:12.516Z"}}}	2025-07-18 16:41:13
9SqhNU-qhaGP9V_k16fl4gCIuAPA5qpR	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:50:02.406Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 16:50:06
dPMBdQ187hjMqyGOPKK-tYCn8yk8SY94	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:43:34.567Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:43:35
9cD4qRvykrz0SJroyeOicveZbFfbe4sJ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:40:43.305Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:40:44
aOM5nLJa3tZ2Au1d5CKEGfhwgRPpu01c	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:52:55.570Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:52:56
Tlz5Xxg96sxRyHRP_hi4TqCG9cJfypYF	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:27:51.671Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:27:52
YM7cMWOuIcg381mgr1HIcTTlQ1bnG2Js	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:35:58.362Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:35:59
2c6b22KgqpH9YteaXtEK17w2fPmvBLH3	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:53:07.195Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 16:53:08
vpQweEzyHQnaPYu5GZHnSK1-YbkzjJJi	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:39:02.376Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:39:03
7EPmOMHynbF4OODrisC_Tgj2nrrGQMCw	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:14:42.702Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:14:48
l_qSu8-C7Hfitaxw9KzUX2YecT2bK94I	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:22:52.498Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:22:53
rT6gXml4F7L-7zci2j4TgCHiKztx3F1L	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:40:27.026Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:40:28
Cv-_jcg29qVW7XXHOZzLV-OKCtoXTQyA	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:59:42.372Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:59:44
8vprhYYR-AobSWkNpbzekN58eh9aezxm	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T07:23:02.488Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":95}}	2025-07-17 08:17:16
l_Ljbvt1YJ44bh3N-UgFlN3nxaRE-iqN	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:52:55.928Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:52:58
tHhxLdZAfu9xqT7uP4zLlXej2cAZlSbm	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:08:18.109Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:08:19
6sHb5uKH5Xojjh-ZAUVVCnGF1H2C08Nk	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:14:56.883Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:14:57
cCNIXa3g0sJVWvF6pE7AslHyl6ACLajU	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:14:57.077Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:14:58
vD-rnlJKAiBVx-VB__B57xDIXwIc0mzE	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:14:57.266Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:14:58
T1WdSLbUq5NcDE55oSDNhDFZSROYO4Lu	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:14:57.429Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:14:58
K-Y2FdsUjPL0uIB7p1ZYt2pj36FeEkb0	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:14:57.554Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:14:58
RSvRjxxy0Xj-mbOj0rDja5dvwnrKVjLs	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:17:15.364Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:17:16
DXiPrsikJphq3aURgeULkUiqafJ_J9eT	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:27:29.860Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:27:30
GFjSDqGjcQgvawwbeEDlq42HeKtD5gnx	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:27:29.956Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:27:30
J_hVayesNnnSW1y275jIlRnMjljo0gDf	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:33:59.580Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:34:00
NiJWXruM0O5v3mkSLfWr7zMa00heAuEU	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:01:17.259Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:01:18
HdNObO_oAYfrdADEXbskdt1KwWuHxxTp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T00:12:55.725Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 00:13:09
NRRuYCaOkgS2ZS-bxr32r-IMIvlGvYkp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T00:24:03.664Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 00:24:04
zgnB2FKYX6mt0ytVsSrbtkttQ2dy-fGQ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T00:31:42.604Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 00:31:43
SqO3scVOdz_ApXSRx5a9s-mTc44Rdhwu	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T00:41:34.891Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 00:41:35
KQ-2MEgz8ehiZ_A-uUlMoImSzJjsogik	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T01:11:46.970Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 01:11:47
DPEp3RHEZgyVg5PwLb-KiUN0reNhV4Hc	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T01:53:05.268Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 01:53:06
NrAFOYlQ-W_fcgYvWoeMREfRtKPIFXL_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:15:34.427Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:15:35
aOHBVebs5gjDgxb8u9dpSkMQLF6jYWRZ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:15:41.825Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:15:42
JEf6LTtJYFNoQDAxb3f6f4ZCIiqX2AIU	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:44:37.735Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 16:44:43
Fr0hyjn9DbUGecD7oK4r02_w1wnaX3iC	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:53:24.345Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 16:53:31
o_9TfnewOlVZX35x24XicJF8TWKOhWdl	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:22:51.759Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:22:52
-FSKjyNWab0ApjG7GlfSDtpU-LYxidEu	{"cookie":{"originalMaxAge":604799999,"expires":"2025-07-18T22:27:29.588Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:27:30
UmcHMe4UuUf4gvhCF-QU3nuN0mlu5tJk	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:53:06.218Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:01:28
8BLoTKoouKE2Mqxg5gTqK4Ab4_r1e0C3	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:39:57.039Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:39:58
MX3ZRSVDXzBWiUvs1MLLX-QVj2WHzKUM	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:02:49.401Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:02:55
3QzDxmwlxe4V5bIhOdV3vSgPQ9JU9dzR	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T02:56:06.826Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 02:56:08
Sh-Zl8GxsARc8VO9GlRtmBnzvKNddN76	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T23:52:26.123Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":{"id":129,"username":"host71526","email":"admin@poker.hostme.today","password":"Xqq2JuLz^mkP","displayPassword":"Xqq2JuLz^mkP","firstName":"Anonymous","lastName":"User","profileImageUrl":null,"recoveryPhrase":"happy-forest-island-jungle","isAnonymous":true,"role":"client","userGroupId":null,"createdAt":"2025-07-11T23:52:25.843Z","updatedAt":"2025-07-11T23:52:25.843Z"}}}	2025-07-19 00:05:39
1ivFSlcLFfAQ3Jw8g_uy7d7Ldhw4Zduq	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T00:31:41.063Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 00:31:42
DisE38k0rfcTS2J7Y6jj1kaBMFMN_u3b	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:52:54.634Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:52:55
r7P55tdXawI0NvHZit1NWPfnKDlkIQum	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T02:59:01.152Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 02:59:02
M1S8b_u_v_fKBeFaZepIy4cPherawvzb	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T03:01:45.278Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 03:01:46
l7xEJHfhfJrP9-IeRrZJcWrQHSVj9bOQ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T03:12:18.990Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 03:12:19
Au1FI1m-P1jqrtYMw9SEKI4sDY2Fz39g	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T00:31:41.832Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 00:31:45
-kJMN83WoG1D3vQNiTrlzB9dHaDgZF3K	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T00:41:35.022Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 00:41:36
WLNWYWc-Q-_qBgiBvfbbeJ-rdZKSWr5R	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T01:12:04.418Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 01:12:05
X8yxjt7OLGGsPxl_JYHKq9J2S6PM6lXY	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T02:11:34.807Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 02:11:35
3EJaEtof6eZ2Y_CBEjnXxlPH6bLvMD53	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T02:24:29.861Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 02:24:30
I_rYIZ5bzPfppGp6p822XFvxE4c1rj3o	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T02:35:42.183Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 02:35:43
ws1aHiiQo9edWJZbSOaqunASsyMZozWs	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T08:43:28.458Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":102}}	2025-07-18 14:45:28
LKqnnLkwKZyuzS2zZD16C5G7G1PTXr5T	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T03:50:29.617Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 03:50:33
PzcNXtYwG8C0fGnEp7kdzPY_7tje-XK9	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T03:12:19.934Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 03:12:31
szE4CGKN5ehhWvNhKqYp2YEX8XX-mM9Q	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T03:24:02.356Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 03:24:03
z0ugB0VnhXvSqYBrNF00nh6klUfZA-1r	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T03:24:02.462Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 03:24:03
IuLNa0ry15K2uUeYh-46SPa2PrvsabQR	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T03:47:02.635Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 03:47:03
LM13qqHr4THmzRi14j6HCamI75yf6Q70	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T03:47:02.740Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 03:47:03
93u1XNuUtGcDJOK7XxNesV4wJgYdrmgE	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T03:47:02.802Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 03:47:03
G2YRIFgzr46J_C6K9HQcdVS82Q8i4kqy	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T03:58:14.813Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 03:58:15
IahRwwFTa4qi3LBTZMAcZlncyEV3vlpt	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T04:16:35.969Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 04:16:36
VsOmnP5pWKccBw40BfVbEMGCdrns4VUK	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T04:16:36.898Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 04:16:37
jwdm6fK_GAhZBG_MG0ZrROih18xVpan8	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T04:25:58.915Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 04:25:59
DMsdiLleZu6M9N4wU9Y_ldwq4YDg7U20	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T04:25:59.661Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 04:26:00
dqV-pbaDiXsVKP_f1gVdioaRS27RXt33	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T04:58:03.499Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 04:58:04
y2Rs_8kP9mrVHRRsGTX7fYG3zYmiG773	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:47:07.697Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 16:47:08
b_gEtEnDAoUbLb1KXUa6i6fkF0arO-MN	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:15:52.242Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:15:53
KakLkJfMrjoYbcuvItiwYiGLjsBr6AzK	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:01:41.652Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":{"id":124,"username":"user37594","email":"admin@spaceman8.hostme.today","password":"W7ZYDIp9uc72","displayPassword":"W7ZYDIp9uc72","firstName":"Anonymous","lastName":"User","profileImageUrl":null,"recoveryPhrase":"forest-cherry-happy-island","isAnonymous":true,"role":"client","userGroupId":null,"createdAt":"2025-07-11T16:45:22.297Z","updatedAt":"2025-07-11T16:45:22.297Z"}}}	2025-07-18 17:01:55
7p8CEwmsl2cBZjEc4atanspSY71f9c8o	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:13:00.363Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:13:01
kviGi9IMkquFJe2syh9Wo93Kaa6s49sW	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:52:55.083Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:52:56
y11cKp5px5JoC8CXbD7lmPGYpKQdjPLw	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:12:29.115Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:12:30
dfcRP1WqxsoMahkl7q-Zix4tiPiuNbbb	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:09:16.457Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:09:17
Zbixa6zYakAXhd3jKMHCHuSZyTASlL5T	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T01:12:03.874Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 01:12:04
rQvFNdzQOPr11yP_tI73E6laa51JogZq	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:16:32.026Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 19:41:39
WfZmWJUPRLbt6VMJJ2ef9cqDPsDFvWv-	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:24:55.839Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:24:56
sDhx4t0iN2TWXjLMWnQikVdTvKz83kM-	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:24:56.989Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:24:57
MCiA0peU_o83NDBeVca9K_GV5sfTvr2b	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T19:06:26.041Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 19:06:27
ouijq6HPWwvr5pntUZCEjUyhPtpB58bu	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T14:49:16.074Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":102},"replit.com":{"code_verifier":"KawSgKSgi2hbJF9W_t5eqx6XdeELoBCUScKzYOkIQA8"}}	2025-07-18 15:29:11
UZ_aQhWCds6vSycz_Vetx1hY-9Gl3V9_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T19:11:45.716Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 19:11:46
k7L9pkJ0In47PmaM68RBKtOyawsn6DD9	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T19:52:57.851Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 19:52:58
uX4UI3K2n_t7vE1z_pgFI2dSWcTSoirl	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T20:06:04.896Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 20:06:05
tx14pdsoKLExNHHORoU-e_6ga6HWX-Go	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T20:09:09.057Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 20:09:10
t_aX1w--Vn-vVovPB8O-95dGEYOtEpV0	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:28:59.774Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:29:21
SLjEU_WqUUszWgeqftm-h9mGVmvF4XO5	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:31:29.627Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:31:30
bdQBpxjUcvcV17J2pWeSKr5M4iIrEx-o	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:37:15.463Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:37:16
-I5BaUaEC1hxVtYL2eSD6hbLuoAtQCsE	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:44:41.876Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 16:44:45
_2oRNGMPUnYJU2QCZGZjsyTevRkyeF9e	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:37:16.932Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:37:17
1fMd35ZFOjqFwPRtoPD10R8NmKW8eRv1	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T19:19:17.537Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 19:19:22
Mi0XYR4yp1ELULpIZJUfl1iXKMYu4TKW	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T19:21:31.852Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 19:21:32
obBbpspOwUylG-kBFIkQfvhjsWlS1OaL	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T19:23:46.437Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 19:23:47
6O4-z0WzivLpetrWLJN86Pr-Fqfpr3BL	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T19:29:55.953Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 19:29:56
obXe_-2ZEInFn4xNr8bI4wbtiHJG8e9Y	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T19:29:58.672Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 19:29:59
QTad1m-Kyn6uSFXrSxuVz_Saexhna3hk	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T19:36:43.123Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 19:36:44
YzzoEkXrGPTRfCZyb71MNLG_PsiqI8kg	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T20:26:18.887Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 20:26:20
txfJym6pmbYJxVhILC4rId8UzY1Vf7DN	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T20:30:39.390Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 20:30:42
d8nNGQbWzKjgnJ6B5gyJSPsnR8kR60fq	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:16:25.338Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:16:26
tJ_nIL_QUPY_NZPWtP_q9fNT0mFY3oQG	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:20:05.177Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:20:06
ImJAWL65xJ_nVr1KxJxOvDkKIjprQdjx	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:13:33.353Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:43:39
oNXCGuyjbIOzPIr2_K0FmKfNGGRsBwNT	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T23:00:53.395Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 23:00:54
1aIu3tgXWCGdCiNSHmvItgOVcljN-qoq	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T23:04:51.309Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 23:04:52
9uzUpoTfwBR4t77QtzZVDREqr7ht9r_9	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:16:11.348Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:16:12
1RIv-nBVU-GH9M5-C06HJifHit6OTWpx	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:02:03.112Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:02:04
ncDVTn3UMVqEBbU4kIDwlNF15BFe6my0	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:02:03.738Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:02:04
o1wk71x8PEW14_xgcplxwdDje7ELHzjn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:02:03.801Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:02:04
YZHT9gggfv8OF7I1IHzy8qHYnM371Sza	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:12:23.976Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:12:24
7RHxwP8yfVm_3MAZJkWur5KQ08qlJgNf	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:37:20.221Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:37:21
X6EE9GMNtVITWN2vn9QdXSTYn1iaJbqr	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:37:21.245Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:37:22
as92DpDACAHGeaumMDeDJXHGgZGLz0Is	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:37:23.439Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:37:24
HI6CjDt6IeqEjiD7luhtMnIYz8pKk6PU	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:53:12.847Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":{"id":11,"username":"quiethawk1893","email":"trems@hotmail.com","password":"c3c37cfcb3b8aad6f1ed81f0b7bf789cd6f7e86af6196da64059faa6b273dc8d63de61efa552ea0f70e9f354f01386db711033b1ad5dbadad4a0a5608da0270e.8711db1b41157fa6cdb1776b20f752fb","displayPassword":"QuietHawk2024!","firstName":null,"lastName":null,"profileImageUrl":null,"recoveryPhrase":"wizard-dream-stellar-bridge-dragon-dragon","isAnonymous":true,"role":"client","userGroupId":1,"createdAt":"2025-07-03T14:40:32.571Z","updatedAt":"2025-07-09T14:39:42.927Z"}}}	2025-07-19 01:45:55
5qoX_i88yuk23fb3EfX6lvdAsUPUGOYY	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:40:17.856Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:40:18
eOw2Iz2a884LQ6vIji8PRZY6FuQXx3r-	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:16:53.314Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:17:02
ZaIQ3r2Jd4ZjKuFrV4AlM8Ga3bw450aj	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:40:19.836Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:40:20
lgC2nSy4fl9xYSrdeMucvRNLMPL2hl-H	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T12:33:57.142Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":112}}	2025-07-17 13:35:29
6A35agiMj0-NKKmXKGgPn7dX7XPyc_T1	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:43:35.007Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:43:36
OlpsBHQRD0wrjoorZllJBfjVEOpKrERh	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:45:04.912Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:45:05
-ECP0QoGgAGSN-KK6SpB8zFqVaxshu7h	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:40:36.300Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:40:37
1wP3vAfBUnJSpQWTfZsERqNg9UH4NMtS	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:40:42.532Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:40:43
ZJnsi4MFewu7jv7y7mEU6pHQDkQ0DiO9	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:40:50.787Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:40:51
IEgow1mnfSQefUVBc9PYoAfCIl5k_PyD	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:39:30.439Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:39:31
Y0DDZEo1jgBTpaov8fMQED_Ik0-3BbAp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:43:16.046Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:43:20
dEiTfc1E_8FvdfeTkYc60y4nlp6OeqxT	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T19:19:18.745Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 19:19:23
RC5Kv6Cqk5Xv9jS7wz49JnfKdXoV6PHf	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T19:36:44.214Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 19:36:45
Tcd6bLUIHdjKYSt3LIFUcwzzUK4HZ_E4	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T20:06:06.947Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 20:06:07
tsdFVBo1ulBB8wNs75RM7G8MFSBTRYHR	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T20:26:33.294Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 20:26:34
DCU6pj5FMGPD1A4GR_YFumZjrQHRlKre	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:14:20.761Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:14:21
QUnpliq_go6hnyF-7W5cGANu4ER8ak2a	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:16:25.450Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:16:26
RnKkbEUd82fPvJzR5uNp82NAiyQZ7x_q	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:46:32.678Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:46:33
KUPwz8gRyvKRcW8EozMSI6lHR-fnT7jn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:57:46.193Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:57:48
f1BxEXYWy7KQSEvZuTSIS2TzrPDnfnR3	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:00:32.158Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:00:33
1Bv7r13UvyuzRvUcpdcm0yI1FNfsJSr1	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:00:39.092Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:00:40
2STz2U671O9H8koF1QyQsZY90vRC24Yj	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:08:18.002Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:08:19
2pb-Kq_vnMOU-gW77rymXqAhBztlitvl	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:14:55.323Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:14:56
alLGm1RvIOoqKk8rT0VAEWeplKiT2Syb	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:14:56.272Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:14:57
weHleN4wk8R2P-VjtpzukWBV7wtZAEGA	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T23:41:10.142Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 23:41:11
VtSWK9VnrA6fvZsyAfnW6lIGig72GuSh	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T16:47:58.050Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 16:47:59
_rZJonFhobK8PZzSofkVWd-NC3it4gFR	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:32:51.123Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:32:52
TogpFLCeWmyK1pwmEmfUAhqo42rtRiVl	{"cookie":{"originalMaxAge":604799999,"expires":"2025-07-19T02:11:34.962Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 02:11:35
O6QQ6zj8rEEROpZqIE9YIm9GbgTtHXSh	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:40:21.210Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:40:22
oqwq9DLF7fwISqdTLaHPzOhicLRGjpgF	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:58:42.578Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:59:10
pN7bwaNK58j9X9qGHUrnrnTsiXPQ_O-C	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:13:37.789Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:13:47
-kqFDI18FMVOTt5LAojpZRoyYsQwOWoP	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:46:09.111Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 18:46:10
mxerlSl6pEJ5lQU0ycesvZ6pbyWP1tA2	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T03:12:18.995Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 03:12:31
SMXGSupqCx_oJm01eo1KVbTubPhCn1ah	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T20:26:33.453Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 20:26:37
71zbNCaZsnOnLrZ9cUmcL1V2X_Tpusif	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:16:25.468Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:16:26
QV36iIR4-1ozTQh_8lPgRbkWnYSmxmuu	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:39:30.685Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:39:31
mHjy2jVAXlyE4U7Xh1j_56C5eyslQDwr	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T13:38:19.317Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":113}}	2025-07-17 14:14:36
KHca5dITWXTORQHhlE5RebRLOgjg8IaB	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:40:11.591Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":{"id":125,"username":"web84595","email":"admin@sahaniji.hostme.today","password":"EYV6a3@yYK8S","displayPassword":"EYV6a3@yYK8S","firstName":"Anonymous","lastName":"User","profileImageUrl":null,"recoveryPhrase":"forest-garden-forest-eagle","isAnonymous":true,"role":"client","userGroupId":null,"createdAt":"2025-07-11T17:40:11.287Z","updatedAt":"2025-07-11T17:40:11.287Z"}}}	2025-07-18 17:40:12
AOnMRSEF-mczOVD2YJIxDq3RMsC0d-8o	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:52:55.931Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:52:57
5pr8F8wYpk9kwkQ-90rY5j7Z2ZfYr0rI	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:52:50.866Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":{"id":128,"username":"web39566","email":"admin@hencloud.hostme.today","password":"qQ$KTM3x4j*n","displayPassword":"qQ$KTM3x4j*n","firstName":"Anonymous","lastName":"User","profileImageUrl":null,"recoveryPhrase":"banana-happy-happy-happy","isAnonymous":true,"role":"client","userGroupId":null,"createdAt":"2025-07-11T21:52:50.575Z","updatedAt":"2025-07-11T21:52:50.575Z"}}}	2025-07-18 21:53:29
tW7aAThd6NuWzBSANc70wwrYjro269bu	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T21:58:33.350Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 21:58:34
7hbaxUOKcUMuHAYYBEToic0vZ9BRNdlj	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:00:39.094Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:00:40
TAtilBrezwCogCZSHIhqFpJefNm6acja	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:08:17.930Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:08:18
NV3g2JiEHRqe16EaIsnaYBugKOKiIF0o	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:14:55.533Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:14:56
2156158gc4aAUDO-L6oWFs_KBKNqt80S	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:14:56.527Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:14:57
3qkvhYSZuibbOebxcYF0Urv7FPlno8hL	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T14:44:51.085Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":114}}	2025-07-17 14:51:30
_i6YwLw6xbUoM3Vg0W7-OZF40McYgTzg	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T22:14:56.678Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 22:14:57
ZMshauiHVFj0swSEZbIpwaXKGvooFSg5	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:40:12.504Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:41:26
uGqo2IrCTbW7f-BqGVoOV_PmuHyOOjfE	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:51:32.225Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:51:33
nNQzNoMKcoz9TMOnOaxqEwF3VlLvMo4_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:13:37.584Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":{"id":24,"username":"khans9304157","email":"khans9304@gmail.com","password":"eeee35e6e619c292f85d50ab39e425533e5375731652a17bf2f15ff79d972acbafd043fc0cacf1d1ece43ddcc27bf72c7866cdfe219b9688968e08853999c236.90989e672fbc9449dbdf8fd5b974c122","displayPassword":"Shadab@#9304","firstName":"Shadab","lastName":"Akhtar","profileImageUrl":null,"recoveryPhrase":null,"isAnonymous":false,"role":"client","userGroupId":null,"createdAt":"2025-07-09T05:01:00.066Z","updatedAt":"2025-07-09T05:01:00.066Z"}}}	2025-07-18 17:19:26
3cLjzTioyKwPS-jjUQ4yiX73eyZer2e1	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:22:50.483Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:22:51
dzE2H1aZmRtgNQO7mjy0ZmhD8JBqx3tG	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:22:56.395Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:22:57
5nAymnLku2y6ItWWXJIF7bMLmKCc2RTL	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:22:56.533Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:22:57
K_6G9vRUWAlBeqP4LLLIjXf-nwekNi9N	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T17:25:58.458Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-18 17:25:59
cgIicKFmALnFvGytvK9RqZgN9LH9eewN	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T04:58:03.381Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 04:58:04
91dWHHCtujfkUFqXjTyv9OARL4kKqdYo	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T04:58:03.546Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 04:58:04
z2hMjet-G-VLCiR3t_Dx6eL9d7BU7n8W	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:05:34.944Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:05:35
YdX1FosBKpNjFHAEC9A88d_jus8FWpZp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:06:19.779Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:06:20
FLqxWMBVjBO8zfC3iygLwcbQX2LM3FSy	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:06:19.894Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:06:20
Usq6HDPAX36vBIE3p2dxtSQv4REAL7rw	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:06:20.005Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:06:21
pY_Tv0cQwbtrfUzHdw3gXwvBhlWe-01v	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:12:38.517Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:12:39
H8ofIHIaJH3ZTFDVLvbdoHX4KtSK2VUt	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:13:39.042Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:13:40
0vn0j3SDBxYvbM_71lKu99GQHp61_JHM	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:22:29.450Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:22:33
ySxV2byPVzQpDuqBUcL0fKslKYMX-nX7	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:22:04.862Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:22:37
gc8OuBcR67XExynHCwnrWPILm2O9z6xD	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:23:54.873Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:23:55
ao6fce7hjQXxoUFZ1XLhwRfXivpkKj68	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:23:54.976Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:23:55
tv3FE84W3K57AlIHfSq33bdZL8UnZFnG	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:33:18.519Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:33:19
jgWM-p0kYlcN2m5lm5d5N0LI89uVM6lY	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:33:18.563Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:33:19
3hUBuHKNf16oV8qsbSFaljSovQDkBoPF	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:37:52.915Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:37:53
vSCzWKi9VjYGz9rNuvU0AZwNhTre9KWp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:37:52.548Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:37:53
SzBbTvPS-8Ofp-jWPZtVN-dNk-ScLGwL	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:37:52.742Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:37:53
C5z76xsu9t0ogK-Wx6J1n5d187B_h2RS	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:47:50.829Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:47:51
wo278zmMNC2LWRH6DwoRFNy83xxKxo76	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T05:51:38.797Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 05:51:39
r5R0EtNYJX5O56TJtCncMj6UHJmEzrKp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:17:45.511Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:17:46
qgFy8-qxlolnNvCqfsTkxxpjKVw2Rb0o	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:17:45.598Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:17:46
VPt_GSf4L747IbeLGyWKEoadWH_ULyGi	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:25:46.786Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:25:48
GrhMbV0k0HjWc4RtwQaAvGDaMlLnxAA5	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:27:08.728Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:27:09
qB5bpgtoNtW_eoJcBJMBV_EoPG_ylsqe	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:26:59.320Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:27:00
s1mwwfkMPXW31LcgRmoQfJSGBcr2H4h1	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:27:08.847Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:27:09
r6tnAq8MA-RpkpwjjHb8sIuBMQSQUYVV	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:27:07.384Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:27:08
42zq7cs84EdV-yny4gzCVFUtZYdIuVfI	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:27:10.561Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:27:34
uyK7PhyFzxNqNOKmLrEwMCH0vc6sR2yd	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:40:52.758Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:40:53
j42GuemnrJW7VdCEu7KHZlJs0AgnEPfb	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:40:59.528Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:00
7Mn-CtyB7G4hBMNZ9orQzZj6TPQCi6BJ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:41:01.572Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:02
59f7Xeg4oWSAikwKjx_2UwBLnnrpou-6	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:41:02.751Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:03
uPtl8Z1vdFPWYcrtyI0EtF8-I6YNy8cw	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:41:10.926Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:11
9lWdnm3qjfDLomNmyiJcQ9PO5lWw2drH	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:41:12.512Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:13
QQwGJ5p9Feb_zDFh_tB_LOuibV0gharP	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:41:15.672Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:16
2L7GWjlJuyghznNaNNNL6cC_7zmygTyX	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:41:17.315Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:18
nP2C_jjStVFlP3ERXI922XMyqT5I9JtG	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:41:19.974Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:20
yYG7QNfqBxROTSG0KzzsORJW5kXBc2xI	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:41:39.743Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:40
3yYAXeRztofx89dLt4Bx50byriAxlCY6	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:41:41.481Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:42
n0HU3IkcU08X1CarW64_cmETkV4K-Ouh	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:41:43.642Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:44
LLRmyMgkAYJp9k59dtV9qbFtjU-uWPK3	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:41:53.192Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:54
3jJW8_AptKEN1k6atkv0edj13fxwa8kp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:41:55.738Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:41:56
2GrfIYARw9EDqoiqe6JOJrVp7TwkUcw_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:00.263Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:01
rP1xKnopgxmijznfZTm6M2rg--HNhlPs	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:07.238Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:08
Ds5JXS95naJuU4WgLvmW1rUmMJjloHlf	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:10.101Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:11
VRtP1rQMXRRmJxR61lfET7U8vBcPVbM6	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:15.169Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:16
TCHjFl-MDnt292XVpbea883qot00FSkV	{"cookie":{"originalMaxAge":604799999,"expires":"2025-07-19T06:42:16.997Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:17
7GRncbvkHU0wcrpdcw44Ngoocdt26hUQ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:20.792Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:21
7bEUAngpOC9Dvvh5ggZxxLrlX5k1tS01	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:24.736Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:25
leRNcEnl5PqdH3BdkN6PgCGcPZKOX9wk	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:28.554Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:29
P1t5xgg0eQF4gO6Zb6KUW5DWlOA061_H	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:31.248Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:32
NCg1WQoH28qNG9AoC_zYxMD14YaECxST	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:32.897Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:33
liExc3tERzzZVu0PFHSvHkBsm_kkQXZx	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:34.735Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:35
8qcVwk1zrsruF0bJDn5O_3qlGMl6k_NN	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:41.607Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:42
axNBYJ8CY6tmii3EMympxf5rOQwbN3Gq	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:44.089Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:45
TSlwl4dx0PnMo_sI-Z-ZZa8U1sPmqQSW	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:42:47.217Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:42:48
DF76fJBxqac6K2P5lkHpgxC4Gq3wLss_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:07.767Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:08
yIq4KeloTnUTHAycSkPHE00MuZV7V2vR	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:11.038Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:12
Slo5wM7OLMegk2NUI3XMEKoJEemEDhs_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:13.855Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:14
G8Ap7hnl738rIM7iPe-dK5W-1ogYrMbz	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:18.640Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:19
ROZ1k0qJQ9w0hIDcoUcAeZqvAb9kKz6P	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:24.412Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:25
hkGkn703T4W_cgq2j5Rp0FOloew7q3Yn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:25.423Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:26
gDoQblROdCabVGNLyZ-5Z5o8NyvAC5Y-	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:28.537Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:29
09hZRAxgi0APrTOpWGSVch77fBJQfD8s	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:33.407Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:34
AJEbQ3A4JcgMM3y1Ezl_J8AebcewTG-S	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:37.362Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:38
1YGmfDsMH41hijnisPjM5vmQqo3DKp1Z	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:39.723Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:40
YVTcwFMihE1ZFfKF7MyzrdUPlEYMMPvl	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:40.874Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:41
6oIw1fgD0JYX06Wy_zndfHyPW-t6I8qu	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:46.552Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:47
1gM7aAODIIT-1LdnoFvEnH1M_rreVUhn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:49.213Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:50
CFnV5EMAy1OslYbL093h5XiZzxUVOSfE	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:54.809Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:55
MtR83zgdTSFKjjrXNd0fLnJfzNpWmzf3	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:55.811Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:56
89jR2a2meG1uAF_gYgv6KVdYMcdQt2V8	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:56.612Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:57
0sB3lb1V1e5C6QTKDeCtot0BYTV9jMIb	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:43:57.281Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:43:58
w0zSqmI-KGCv16GNG0SkgTIblgmvYzpg	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:00.823Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:01
IlmupG-spc3pDKUdfdhNEN4XG-7R5AHD	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:06.603Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:07
QMPQtlu2TVtEc-jH9wciQb_xIXsJDNeh	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:07.580Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:08
F7ru8bos2cuZWHqNUj4Fgtjk-8UVU9kt	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:20.634Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:21
FWbJy4Ka3UOm2KHPShJFeX7NPsdisXAI	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:22.444Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:23
j3orkricGX2KBRDKDM3726ltvie9VK8h	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:26.953Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:27
DTkPzulh3HGLCJHjVNsVtSCDDHkjDhRN	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:30.553Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:31
wQ_78kRRcgFuWvwydmKw0GsSH-0gToVX	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:32.276Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:33
IdyzFmhWSn_Gspei_zcaiuKhANaGznTd	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:33.793Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:34
CdPM0jQq1P2JD4J1jmSPGbfg4eDx7_Iu	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:37.619Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:38
yp0DB9q1QOmh4ke1C3mg471SWTBJysGh	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:40.841Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:41
CjO8IFSvXOs6WNOeqM86mhVIaZR7qyxT	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:41.402Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:42
1Knj85BuMRU7lhBTUG2_uHPbPKZGpxGj	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:44.203Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:45
KadR2Y2fVAUn_Xo5TAI07j2ajFWlKjB1	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:45.593Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:46
FMSgrHOWrRhu2GUMZwqGOYGY6frSnYk-	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:45.881Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:46
yykpItK__ZDyQ7wnswrzeqovRHq1JghA	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:51.066Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:52
XIrQwW6ZdENjqV2Bgkkjbyprai63WKr4	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:44:56.193Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:44:57
b1EsJYu2A7qeyMkBic9Tuaaf53c-WUDg	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:00.467Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:01
bbOUMVhIFjwhtmYJSDqMk1e5cr2KULEd	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:02.994Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:03
Xtup4FHcN7Hjd9DpFzQ27odVEauqIKnO	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:04.702Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:05
lAy0l84TqUCM0dfoyOZEtN-6evVW6wal	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:07.409Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:08
3y-PXFZWAFh8QVYU6RCIlO43XbiHt4mY	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:12.457Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:13
OR0HQIFnYKTA28YmypXl_bHXJffgSGXc	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:12.740Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:13
-xSSLFeBAILd_9JgdUqySXLE6YJi2xHG	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:20.268Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:21
z0bBKiKo1eQm29KZiLA0Mra4XIdF3Cik	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:27.716Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:28
r00NE9Js3O5UrZ5vAORV2mmpCQa1tsAx	{"cookie":{"originalMaxAge":604799999,"expires":"2025-07-19T06:45:28.809Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:29
srTfGRWYAcrphY4dDlza4BOvF0wLzFs1	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:31.916Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:32
ryCw-JAElHv1hRH_diTZ0raV1_DMFc2H	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:37.297Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:38
Aa6D_bIaHWTjz5kagFnIajpu-ukWYEcm	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:42.291Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:43
LUafch4g-tW0P36gCvAH0PVZe8D_KIgU	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:47.145Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:48
PKVFIF1qRBqNjU37yl5aSdz1uBsBMzZA	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:48.360Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:49
r8SdJvFswZTzdMZxmROoulLObLoBYuug	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:52.082Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:53
cKFGJz6yfZTXizqpYravwyc0SwzSRzWO	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:53.911Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:54
gsWm_U0LCcTkF6c9mViFo6FY7hR5hdoC	{"cookie":{"originalMaxAge":604799999,"expires":"2025-07-19T06:45:58.276Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:45:59
IrjylEb9lBGL4PJBcZhbX-pGbP6YX9EF	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:45:59.161Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:00
iQEYwq3fBIJ0crzrW5X7NFO9UUqIiuIn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:03.420Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:04
WUlYCB5bHUObjUc0pojJsmh4c9HpYB9P	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:04.463Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:05
Oaz1R07AHTOHKYPvluyblFVxbH5Mhj4U	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:08.694Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:09
EycwIExV7Wkwck8-lG8tp-QAtUwrR6Mf	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:10.018Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:11
SsBnNJIwjrjMOAn_Eh_LnQoB8XOCbi1u	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:12.201Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:13
aPY5kQ5lbX8Tzn0b9wwl-W-1BIzoQTsr	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:30.678Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:31
lYb79MvmMlt8qACNAB9J8Ljp8TyoDW25	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:32.343Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:33
_526YOnsh_QRdq21lBiDKXXSN5smVxFI	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:35.189Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:36
1Mbt9bgI82YFdSu0pSSaZERpNJitVIwI	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:36.469Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:37
bfCkhrp9CSZNP6kFNobMtR9DwhdxDq-e	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:39.261Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:40
RSXPlC1-bty0mxkasUOC9tRDZh4UT_Ba	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:40.343Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:41
cu72t0O3CVpNo4ujOdNyW1rfwTCrKZ8l	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:45.302Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:46
47zSg52BD_OpXqx4TWAvk5yUzNwMRSRB	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:49.691Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:50
17nvRMKGLXMhRr_MlV226G2vMV8g_lp5	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:53.221Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:54
mEZHEkVc_YsIdoRtvD8ojTETg3WaE3OZ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:54.484Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:55
PZbSbJoLmpz2WZ1fn_hOBl-1jvmfiJt_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:56.760Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:57
PH29x11mT2kc8VyRNpar4-XiD2DupeM5	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:46:58.932Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:46:59
eXaOo5YyLn8Ah-O5saTsDIYubY_GzQO5	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:00.368Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:01
Zi1dz9idvF13Z-krMs_Yzn04y-iWv6I3	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:01.712Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:02
aeELmlKcaTmClLIqvVPYRIXwCPFncRnt	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:03.881Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:04
pCvT5q35A7imFtlI5TxlyNf-ykJfaZYX	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:11.548Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:12
-f9CHEs9oD5CBKGLDDv9aK1U9wXQJERJ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:13.522Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:14
_XcGu-eW_7hmv6zXluBoeaOw3LpcLNvz	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:17.838Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:18
KQdnKHJYvBpdo7s5esS-Q6wZld-2bQJY	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:20.748Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:21
ccoZ28wLeomGOy80MufJpqrADup2u2aM	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:21.862Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:22
eq3spITsv_nP0W7G5hbPAHBBkKhfr5Bo	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:23.385Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:24
fMwEIQ9T_f5bLpFI8iCovd33keeRmgvi	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:36.572Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:37
TvFmXYkN7j3PWFLXHjBo3FKXkunyiVIb	{"cookie":{"originalMaxAge":604799999,"expires":"2025-07-19T06:47:37.233Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:38
wGIX-2D5PiybKhqBiNBmg0IptmYPYkO_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:39.234Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:40
Y9M3SMUQhO-0y0JlFs5Y-2ySQnFIg6Hp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:44.365Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:45
6-k64r_C93A4RQOUT2iSzXNutbdmdHMB	{"cookie":{"originalMaxAge":604799999,"expires":"2025-07-19T06:47:46.190Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:47
D57NL04V1ap59WPsr7ORugx2mj7jatPm	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:46.544Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:47
wU54uV-6Q0SH_NooDgFGmRHFeuG3g2fb	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:49.905Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:50
HtvkIfIbaNSchCjFXEQx5GxKWAsUcpGh	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:52.328Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:53
8k-zrhiQ6IVDtkx45VlLQ-ANccOC5jfn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:47:57.811Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:47:58
HeCFmyNSbpGPPfAV4w2wcRt3Ijn9LN4e	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:00.592Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:01
E7mwOqg3FsldrTo1Q4cnwQsLWAYAeCJA	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:05.397Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:06
lPVrbgxMlXCSHtEpTKVpzijQ588xjm3F	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:07.391Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:08
Nnqst240AtluOx5Prme-arqg_DikCO8u	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:10.210Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:11
Rgq_GRg0iS1BoJpTq-OASvrMhHBx-f6V	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:11.742Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:12
CC3n2JJkajs7gBIO1hw_FxKhZYQwjVee	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:17.358Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:18
HO9ERHbPQowCgQ-_EFGxi8izAQBeMyEU	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:20.275Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:21
mmWYqu50ko0p_v-1uZ8yfUlDhfsNIqAC	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:25.324Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:26
HNVwHC_0MKlx_2stys2KnOB99iwsBG8A	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:31.233Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:32
xYTL7jl_iVe5u2p90hM8JCxVjqgkfIkF	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:42.770Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:43
EIEGwD8mye9oFePmqDQ6CKMHYzLr50eg	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:46.772Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:47
wCRKrDMLP1ZVUWqIVYn61-nM5rE2iZXI	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:47.592Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:48
_d1y_-wKHSoE79xwQnjw34SWqnpwQ2cC	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:51.601Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:48:52
3NOYIaW8kphQAn7K0885rsafKLZS3jBj	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:48:59.474Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:00
FOni__MsAwaWUx3pQr5kZwhRpKB_tCKx	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:01.138Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:02
DcHsMrbJejQMfNcdb9TitDydPkrVe462	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:06.556Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:07
QK03YonH2FA9S6CcJXpQg9H4pkmzF58y	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:08.444Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:09
lB80j-DZp-JhDif4HkwurOV6c1pf7CGy	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:10.093Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:11
g0pnUESeImALRhzaneA6JLNYVG_2Ml4V	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:10.750Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:11
qC64wqF2m8uvellqeUPk6ivxouzccZFn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:13.480Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:14
5-1MWSF9CqvL2YDBDBWuNw_wtL3NrAUp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:15.739Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:16
fVPonh7Xoms4EB5nbiAkn5334lmD-cNB	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:17.981Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:18
moawHep7uOkdFX75zIOoE8bXLLqUqV_l	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:18.889Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:19
rKYKXk2wJd9f7vQkxjYc2n7UN4wA7feg	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:20.642Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:21
IuHJpDajQk-MHPVsm1BJdVwX1N4gLbsz	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:23.199Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:24
m_bYzFISrz8WwE0qnpZdxiZAMfCEH8tx	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:43.415Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:44
dl379Rk-_s7VADCXCqICXnbm7yMeDGJi	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:43.854Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:44
B3J4ha9mjBGci2hLHAcBXcIXrXnv_JzB	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:46.433Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:47
EeyIBSc-44g2NP3Uj3FIMLjTVgluilKO	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:48.220Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:49
0EP4GOqxGDZ4kGCJjLyYZ4DGpYViWGTb	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:51.277Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:52
1ZzNYKvcyK_iWpzQ1yNeVgD1H2wGo3hR	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:54.520Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:49:55
M_XeblbIfJ3vN2ZHRfS3t8zfNwTMtJ0_	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:49:59.279Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:00
pjB-CCnsd40siT-cK8oaual-jkTqGs-2	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:03.087Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:04
eeUT4hxoIZgZfkeQTXuHcSLWOYxbz7QW	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:04.131Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:05
oJ9PhbhNCl_U5uCRQSOr2Tnuc5RrFZzt	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:10.406Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:11
em1iTJAThlLTpDDWGFfAovpt8dgkY7Sp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:12.366Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:13
kvYQShD0S6KwFhykA0mfqwl-cqK8HYnS	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:13.640Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:14
N8_2hmzqCjVnfum-QFHTwg0Dy0m9XbF6	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:17.309Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:18
1a7Y0HrSP8AQNWvmgWxUS-wDF5zcCRFY	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:18.796Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:19
wzT98vBzfP8ZWrdTzfQgNMeqHnjNBxYc	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:20.165Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:21
PMMcnUqk3FG_Xte2tDt_e5vPiWWV9MKN	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:21.883Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:22
YdxFh4aRcGgJlyBq--TwjeUkdi9ulb78	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:24.404Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:25
LlREHbWAL38Oeu5SFKGDZ2KKYPk-d5h1	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:26.291Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:27
uEbh1kWnmWlI3dF8pXXUDJWcLeRoJwI3	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:29.384Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:30
ibFvrs1AF6gbhfvKxQuoXzPlE5kJ3RuR	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:30.767Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:31
3edA6x3-RspSo_D4TIG0SzjZVPxUx9j2	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:35.745Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:36
URMMHgCJr-ZEmE4CcZvQGDXzzqEICZcn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:50.330Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:51
ITrTs94QcMf5PGtglnRsSuAPvqdyuMat	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:52.371Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:53
qe9HsPd8sxfvgm45F4pR4N5lERzt3JY2	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:55.078Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:56
dQXOYp5AFG1gcffaQAMD8ms1TKnP26uX	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:50:58.939Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:50:59
cyAEtRieGfFhIltIh9cQ2F6b0lPU0chL	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:54:50.637Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:54:51
a05xc8y1SmfxVYbzsR-Q1MOm3bhyS_mr	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T06:54:50.697Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 06:54:51
nsSjRTmjphseKRjYzhEDbxK80uyaBuU3	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:02:39.650Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:02:40
nuShhDKQYZM-2sRectX8JEkmzgs9kNSa	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:03:10.757Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:03:12
hRHUUHvkM7rwNwb2BaDzYvNZLLvIQWTH	{"cookie":{"originalMaxAge":604799999,"expires":"2025-07-19T07:29:48.017Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:29:50
z94Bjt62UjLmN1_c8zKYLSSXrb_jjORp	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:30:26.779Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:30:27
dHrXcffPsZleQWB34X9dde1n5YLtInnL	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:36:16.508Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:36:17
98rDe9ahao4VZ8IgwQkiy3Ip9Yp3U7kn	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:39:27.941Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:39:28
vxGaiuPLDsza7Bd6BufqFsAdFYuNUivC	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:39:28.166Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:39:29
zo_hPNl2i7eajW2ItbVG6jtBiDJq_-yH	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:41:27.736Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:41:28
-ziRbxUCaJJBgzKGCzuvZ-thWG5Z10gf	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:43:44.548Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:43:45
Wg5psLfAueLymixrpw2SERNuhlN82ivY	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:43:44.244Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:43:45
N2d48346TmGjfWx5bBlqAqseXVEow9xq	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:43:44.396Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:43:45
dga48U9e0GFUcbOpJcFwpIyg1CL1NM2r	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:58:37.324Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:58:38
4GAdE7FCgJP7L8U33w-OE5EySElUbx0V	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:58:36.980Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:58:37
W5CGdVaR64uIM5dj5JlGKj7fRU1_Y5aJ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T07:59:09.700Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 07:59:10
Hu6dY1c0y1i5OQVcDfBoOvxYCTUPx9Zf	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-17T05:03:54.485Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":83}}	2025-07-19 07:59:14
H7KvwZeqHDhEBVWbn6I8dvWdb3JLJN-L	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T08:00:17.720Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 08:00:18
VqOjE24Qfi9Fanq2Momh-aJqynaDz9SQ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T08:11:53.321Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 08:11:54
PseK1hw5Qiu409F16rqsPh2N5ZQ_CKBd	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T08:50:23.267Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 08:50:24
3F3EuBRB_7HaOLATX8_i1AdwpMmp86ho	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T08:50:24.104Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 08:50:25
sAz6dYXtzg6Zlwy7crj5iDanZWdK-o4C	{"cookie":{"originalMaxAge":604799999,"expires":"2025-07-18T16:47:38.641Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 08:54:47
BWExkp7VRk0T_jECxZmQuccUrirkKIxq	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T08:54:06.956Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 08:54:07
tBt0J0n7-mWcl2m1h2L1pZZaJbfUrHXl	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:05:21.016Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:05:22
Pb2KmZHewBGVyPFl22TiX9DWfPoJprL4	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:05:21.100Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:05:22
2OVWAFhcDfG_sjq1e7a4kVHehcrnRJkV	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:05:21.292Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:05:22
AozdWfFZPrKDrKk4JCvfbs2aGBRV2qd3	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:18:25.089Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:18:26
8hylV-jtVAWYPAiP---aeWFJP8DRRgbf	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:19:36.633Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:19:53
uHwZbEqUd-eJABxEdbh0rtRJXPuc5M6c	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:31:30.638Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:31:31
5zctkewIjL6NLfQ-p8ppeJNPfy4_15ZQ	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:42:37.032Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:42:38
gI7mND5M5vJ8EnKd-l9DDKqjGvWmKuuT	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-18T18:10:16.199Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":{"id":127,"username":"web35220","email":"admin@spaceman10.hostme.today","password":"BGtHQvc*t&kA","displayPassword":"BGtHQvc*t&kA","firstName":"Anonymous","lastName":"User","profileImageUrl":null,"recoveryPhrase":"forest-dragon-island-happy","isAnonymous":true,"role":"client","userGroupId":null,"createdAt":"2025-07-11T18:10:16.084Z","updatedAt":"2025-07-11T18:10:16.084Z"}}}	2025-07-19 10:05:16
e_l4e_mkgVhQGRMR1_9RbvsoK7fYzQLq	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:42:37.142Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:42:38
BoAx2AYYcZQ43MkyM5EGA2AIfgJQbVWb	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:44:13.364Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:44:14
qp_Do5F_Gce0qbvRLyrwhIrvAWO3j9ty	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:49:11.455Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:49:12
waA-8-ZZ4k7ww_tjHeMcNwHX0rJADYLY	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:49:13.451Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:49:14
0_8ODLxH1Jr-QcLwTrAmUH8g2WYT5CBb	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:49:48.622Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:49:49
-hvz_OCgubFT1HJ8I5iBdEmv2GU0UCOO	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:49:51.717Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:49:52
0-fHYiO0sWYPLdGm1huvFGv5GFwN--a9	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:50:04.553Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:50:05
8-rTrCdb_BVMLS0wT6SMfIThId58b73L	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:50:04.661Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:50:05
lXi0pLsPT1pej07aj6F_JXl6Ud6a1QGt	{"cookie":{"originalMaxAge":604799999,"expires":"2025-07-19T09:50:03.097Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:50:06
Pc0ik7C8v2iDZ7h9GiKZj0lbyTwZnpFY	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:50:03.203Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:50:04
PTouoGnv5Fjv6RBDikKxBuLae4XvVsKX	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T09:50:04.315Z","secure":true,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 09:50:06
LUJsvQgDmEiegP1cuzX3grGV0Q7CAKrv	{"cookie":{"originalMaxAge":604800000,"expires":"2025-07-19T10:01:48.103Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"}}	2025-07-19 10:01:49
\.


--
-- Data for Name: smtp_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.smtp_settings (id, host, port, username, password, encryption, from_email, from_name, is_active, created_at, updated_at) FROM stdin;
2	mail.hostfarm.org	465	admin@hostfarm.org	TrainPlane1526!!@	tls	admin@hostfarm.org	HostFarm.org	t	2025-07-09 15:49:10.345145	2025-07-09 15:49:10.345145
\.


--
-- Data for Name: stripe_settings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stripe_settings (id, public_key, secret_key, webhook_secret, is_test_mode, created_at, updated_at) FROM stdin;
1				t	2025-07-09 12:01:30.913738	2025-07-09 12:01:30.913738
\.


--
-- Data for Name: user_groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_groups (id, name, display_name, description, max_hosting_accounts, max_devices, is_active, created_at, updated_at) FROM stdin;
1	Free	Free User	Free hosting with basic limits	2	2	t	2025-07-05 12:42:38.339428	2025-07-05 12:42:38.339428
2	Donor	Donor User	Enhanced hosting for donors	5	10	t	2025-07-05 12:42:38.339428	2025-07-05 12:42:38.339428
3	Admin	Admin	Admin	1000	1000	t	2025-07-05 13:02:35.246119	2025-07-05 13:02:35.246119
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, email, password, first_name, last_name, profile_image_url, role, created_at, updated_at, recovery_phrase, is_anonymous, user_group_id, display_password) FROM stdin;
2	embire	wow@openweb.email	2859b29afe7b5c22212aee1f510c771a8124012508b871e7dbf31e0aeb7f13c3de6ebd3f1ca567e9372d630646c1318c5311da606a92655b2aa7841a598d99bd.06bb24947f54a63b5a17a3f58ac465ad	Keoma	Wright	\N	client	2025-07-01 16:16:31.62636	2025-07-01 16:16:31.62636	\N	t	1	Embire2024!
3	hiku	jinmao521@gmail.com	b5f0605e89ba91e3c00b71cdf91fb2409b877af28ea8a56b4a1c71feac6bc1bdd3c574a412795e2a3777c8c6ec5af6c425598d4d924a68124d140686b62c07c9.0e78e7590467a2decbde6a1239c9ce96	Mockx	Lee	\N	client	2025-07-02 09:14:30.950708	2025-07-02 09:14:30.950708	\N	t	1	Hiku2024!
4	embire2		383512c564e66d0c05c54e35831fb8baa66c49ae0bdd89137ff3b69deecc38ce6fd8ae623c5ee156a1527bd900bf37e48b1222e1f3423d7fa79f5dc1b80a7153.b4d36dd5a965843593c95de8f29407b3	Keoma	Wright	\N	client	2025-07-02 18:34:39.872702	2025-07-02 18:34:39.872702	\N	t	1	Embire2-2024!
5	sharplion5635	\N	34a83a22e274bbb68e9f0f518e7dd8386295424549c6ffabe83bb95190d22918afc38b9342cef37a5eb86711d503b1cfc3eb7fbb07ce1e279920002d09a9b10f.02402da74eba9091488cb43f0b38f4b7	\N	\N	\N	client	2025-07-03 13:22:51.157844	2025-07-03 13:22:51.157844	thunder-stellar-shadow-cosmic-portal-magic	t	1	SharpLion2024!
6	freeowl5149	\N	dfff56a6c605503c8569b56a303d8222d30e3a547b9c6c20486566d989d488891c8481208d6839e82c8707990d1b3b8aa6295b00bc5a99bf8c19a151036b98d1.71fe82712ae426efd4163a1337380962	\N	\N	\N	client	2025-07-03 13:57:07.376288	2025-07-03 13:57:07.376288	phoenix-crystal-magic-tower-wizard-tower	t	1	FreeOwl2024!
12	quietlion9009	\N	8c3f6b11e1e6d76592abd67b330414ac32bd5faad00e9e62407d54a9a54121b094854e42f1bcd60e5835e1ed45ed3edb7410c25b943d0997e10f454336e59923.edb84d2012454314dcfa8cf2f44aa1e7	\N	\N	\N	client	2025-07-03 15:04:01.745844	2025-07-03 15:04:01.745844	\N	t	1	QuietLion2024!
22	quietbear845	\N	c644636a45b5f9dec9b716039da2f41550c037e83a318be6bd241527c831206ebfa457f80e252fc50d077c7cc564487c6eb00f62dcfb943d1a6d3004db7dc06d.87a2020fb6ea5ece7630170b1ebd126b	\N	\N	\N	client	2025-07-05 16:53:54.858662	2025-07-05 16:53:54.858662	storm-phoenix-golden-wizard-phoenix-shadow	t	\N	RBsGguryUaRQ
7	brightshark7823	\N	3d76a1003e6e9e4125252d15a2d14260c2314d46725ed9ddad137d9818499aef77db7d53441dfe17f688c3cb8fd0f6b11319dca5cddfe8795db06de012c2be79.21e5324d263d1d15ca67b512dca014c7	\N	\N	\N	client	2025-07-03 14:14:20.174067	2025-07-03 14:14:20.174067	golden-stellar-golden-light-golden-wonder	t	1	BrightShark2024!
8	clevertiger6807	\N	922a91340f4e95e6c4b9fcebb96a4713b35911f14333e2da7edf5f1460684387a33a8d968d74554cc3307e10e9f52feb1b57a14fe340e46bcb2eb83dc39749a2.595f3966d2f0a9d93729140125eec727	\N	\N	\N	client	2025-07-03 14:17:01.047158	2025-07-03 14:17:01.047158	knight-thunder-tower-castle-sunset-dragon	t	1	CleverTiger2024!
9	wisetiger1944	\N	a7c744220fd3c24f0fb4666a35fcb2a817498636d0b6149979e1d1f4183d73ccb167a11deecc3d4a92ad8eac4a657450b8bd74c3d0d0d1c78c5e71c3def08bb7.425d9265976d7afb03a0e96c69d9f278	\N	\N	\N	client	2025-07-03 14:21:33.354245	2025-07-03 14:21:33.354245	golden-portal-wonder-wizard-quest-mystic	t	1	WiseTiger2024!
10	boldlion4507	\N	d2469c5d9c21ee5347efe3d02e8dcf62847b59885d57bfec515ff999607cf391ec42f377b11183ae461b021fcc293403b92f0ac800818d01330760e9d4c2e6c3.28640f1ddf79a50d813146394f890c6e	\N	\N	\N	client	2025-07-03 14:31:17.876557	2025-07-03 14:31:17.876557	portal-dream-sunset-dragon-stellar-forest	t	1	BoldLion2024!
1	keoma	ceo@openweb.email	74e6e8cf8e907b3d1ff27359d5e646c5a69748a923d57a44f57dfc448751c7bfdac3f04cb3da73a8213ad2c44cef50e28e36bc6eb4354584f293eb5b0d6e3eda.4c28d673f8301bc11903a6ab99154a38	Keoma	Wright	\N	admin	2025-06-27 17:39:46.761703	2025-06-27 17:39:46.761703	\N	t	1	Keoma2024!
13	sharpowl7516	\N	3cd5f1997e26fa673c3955e8591dd85c222b1315dfebc20761cff6cf02ad6ae4da0cfcd627f573fa405dba3f834659f82d77e1ca219b280a4360ec4315a4b890.3a9d4d44a71ccd2e33fbf5b5609fc10d	\N	\N	\N	client	2025-07-03 15:23:33.414109	2025-07-03 15:23:33.414109	\N	t	1	SharpOwl2024!
14	boldlion8955	\N	8a0e9adb31f15c593cbce82567ff272fe082c828669191514fb169e5413093b3938367dbfd60ab388294af730b614740826f6b8f5b4786442109eeb04532481f.b34d937e167c611010800ed624a187a6	\N	\N	\N	client	2025-07-04 15:03:03.173994	2025-07-04 15:03:03.173994	knight-mountain-thunder-stellar-light-shadow	t	1	BoldLion8955!
16	brightshark3074	priority@openweb.co.za	95e996fef751af1955c0930926a9d81f7feaded046ecd50e2748f02561878fa90536d7bff7555c41e5cca1f2d5f617bee81fc4158bbbc5441358003ebc0e6705.82cffe7ceecb9f766a3e1ec66793200d	\N	\N	\N	client	2025-07-05 11:05:11.657626	2025-07-05 11:17:04.929	dragon-diamond-golden-dream-breeze-bridge	t	1	BrightShark3074!
17	freefox8533	\N	25cf0fa722d8bf5d7c2250ef5f359d0118948423f4cae2cee3ffcbef4f01472d025cd7c662c311c87b674d5997a010eb33159ea9d1cbabed9822a452e4ef914e.333d2691fc579f9d19d85d5c38587801	\N	\N	\N	client	2025-07-05 11:17:41.491018	2025-07-05 11:17:41.491018	portal-mountain-stellar-knight-bridge-ocean	t	1	FreeFox2024!
11	quiethawk1893	trems@hotmail.com	c3c37cfcb3b8aad6f1ed81f0b7bf789cd6f7e86af6196da64059faa6b273dc8d63de61efa552ea0f70e9f354f01386db711033b1ad5dbadad4a0a5608da0270e.8711db1b41157fa6cdb1776b20f752fb	\N	\N	\N	client	2025-07-03 14:40:32.571958	2025-07-09 14:39:42.927	wizard-dream-stellar-bridge-dragon-dragon	t	1	QuietHawk2024!
18	cleverdeer5394	\N	6f47a88edfcde5c03b16757d56750482498a1b4f5cfb173957d680ae4cd1f9cd547cc169e26a54ec15c9162b4f06d6a1116cb4257281cf1e8749242e2659e03f.49bf3630759f94fb53835137d763781c	\N	\N	\N	client	2025-07-05 11:19:31.378759	2025-07-05 11:19:31.378759	ocean-dream-dream-dragon-storm-diamond	t	1	CleverDeer2024!
19	calmshark6845	\N	1f487daaaa9ceae7a70dfcabab8bfc14b7172839c0bbbac2763a66b0c492ac462044bf9e26a19a4607b7f42366c32653694d516517aae0082a26d7bc87a902f7.7cef24db3cf2dc94c019ea5f7f40c1a9	\N	\N	\N	client	2025-07-05 11:20:19.974874	2025-07-05 11:20:19.974874	phoenix-dream-forest-mystic-tower-silver	t	1	CalmShark2024!
20	boldowl1505	\N	828641c0e023cc3ce4cef7a92065c47454cdc1b76f2bc9bea429aec2306ffa5f79eac81a33f32403b804ec7d325faa29b53cd547edb7eb45bea7d0d29e94fba5.99494d549f07abb1576b4f227e3a0512	\N	\N	\N	client	2025-07-05 12:06:28.471403	2025-07-05 12:06:28.471403	thunder-dream-dragon-wonder-knight-silver	t	1	BoldOwl2024!
15	admin	ceo@openweb.co.za	7ad5523276a7444e3c4f912f7e7f87b6b1b46903579576abe54699126cab55513efc09d25af8407c689b4deaa034d933aaba0de86c8edec8541373271c2ff8ad.32443efa5dc3177ab2b4b4890a834063	Admin	User	\N	admin	2025-07-05 10:29:42.021468	2025-07-05 13:02:43.278	\N	f	3	Admin2024!
21	wiseeagle6632	\N	e5bcc92d50fa56f697e5af65621051ce2e540f6606af7c0a9b079530d3bfe7a231da1aa289fa351707e70972c6021d063509be4abf8330c0b0b8fc87c553b517.0a05a5c7451e04e85f5eac70a0d01ba1	\N	\N	\N	client	2025-07-05 16:47:46.252522	2025-07-05 16:47:46.252522	mountain-wonder-wonder-forest-sunset-voyage	t	\N	WiseEagle2024!
23	galeaarkander457	galeaarkander@gmail.com	d15ab61c957d378c2682e7f8e8a0c12ed1d057fc84f64e55443b173a067b5458da3c7806a45bc813c4b777755175733b2cd84ecbcadf74c1977155f400d1c312.c4dab6e04301c3d53f7db08a5f4d9e85	Gale	Aarkander	\N	client	2025-07-08 15:35:57.977057	2025-07-08 15:35:57.977057	\N	f	\N	Apple1526!!@
24	khans9304157	khans9304@gmail.com	eeee35e6e619c292f85d50ab39e425533e5375731652a17bf2f15ff79d972acbafd043fc0cacf1d1ece43ddcc27bf72c7866cdfe219b9688968e08853999c236.90989e672fbc9449dbdf8fd5b974c122	Shadab	Akhtar	\N	client	2025-07-09 05:01:00.066072	2025-07-09 05:01:00.066072	\N	f	\N	Shadab@#9304
25	asherkamal8092643	asherkamal8092@gmail.com	f7ed2593dc8381da20de1a481e879f1293d55c1928a2cf616b8facfee8449f062a8f139f8fb68dd7c85948b811d87b98781828ad2fe4994b3ec0d0ac21822f7c.1bbf5c66019d2973313743b61465c72c	Kamal	Kishan	\N	client	2025-07-09 15:30:47.308001	2025-07-09 15:30:47.308001	\N	f	\N	Asher@8092
26	danishmehmood5001195	danishmehmood5001@gmail.com	e8fa5b2e19b0a77f4bd4bad039e6e9c080cb15d7970f6f489b585f26c9b36c5ba95e2197ef1005c78ee2653aad3db2a328640146d3dded0bc7fb1276aca12953.39dca9889592db1e3c859ccb132afb17	muhammad	danish mehmood	\N	client	2025-07-09 16:47:53.317339	2025-07-09 16:47:53.317339	\N	f	\N	danish21M
28	cmwebpk337	cmwebpk@gmail.com	b20d42ee5627f169315662b5db1074264dcfdd4abe17aad9aa60c3e6c824d288052e43773e55e0a14ee6b0ee47c415042178241bc0341bba56ceb7042c20743d.e37d675e202c56f12a56878f90e5cafb	Muhammad	Ali	\N	client	2025-07-09 16:56:47.499341	2025-07-09 16:56:47.499341	\N	f	\N	Ayanali2010_
27	swiftlion865	priority@openweb.email	c20dc72ce284ccaa2c18d472de1d8474f71ccd3cf1b4f6f08ff51a27f8e9d142252a6e59cec9017c95bcb7af036c71a27fd339c058ad796b6ae0292e22f864fe.ffa883ff05885194f35c280511dc700f	\N	\N	\N	client	2025-07-09 16:53:54.42654	2025-07-09 16:57:11.542	forest-phoenix-phoenix-mountain-tower-dragon	t	\N	qyVQHV6XfkBf
29	lte52	lte@openweb.co.za	792cd5aacfa00599ece66b093735c8a0b8c625810a74ef520c9f21ba9f00ed22b337a4e810a5e5ac0480cd1afd9d4c1f084faa31c3f7b0d4c52491dfc1c6fa08.8f1ba3808381387fca552a495f99207c	Keoma	Wright	\N	client	2025-07-09 17:05:34.888241	2025-07-09 17:05:34.888241	\N	f	\N	Maniac20!
30	xolanin37	xolanin@openweb.email	ea058d81920e76cfff4b8cf8432df9fe47f71814f8f58dec392069e70c667798e1d9c1ce2b464cbf9cdc688276997a65087e00d08dffa156026dab59f45a6dc7.952c23cac67d93ce9230d467ba937faf	Keoma	Wright	\N	client	2025-07-09 17:10:45.927138	2025-07-09 17:10:45.927138	\N	f	\N	Maniac20!
31	cleverbear4764	\N	4c53723a57ec6adc630c80e68b11bc377f1649166c8dcdeac1948f3d13efcf51bac10b8ce1095aea45b933dfcd87aa2fd7439dd9ca9cb05007a655acb5cfbfb5.ef6a21dd9bcc67c9ffd0e950aafcbdd6	\N	\N	\N	client	2025-07-09 17:34:11.814115	2025-07-09 17:34:11.814115	river-river-cosmic-light-wonder-tower	t	\N	QcSC8pFrEU2w
32	calmwolf2035	\N	9a496021321900a403f19fd8bff639af2679bc3dc775a45f37f09f771e550012c073039260225503238a884808b738dfb808283b6be9e2fbb2164cc2d44e4160.8c377084b643981fbb9e98eb6e22b130	\N	\N	\N	client	2025-07-09 17:55:05.751394	2025-07-09 17:55:05.751394	river-mystic-quest-ocean-cosmic-tower	t	\N	YKRc3aQ5apha
34	freeeagle2377	\N	ab023bd1ae3b75e21202d4bfd31dd7b9b0557ac4a322198ebfc9f4ef6ec05be0d6234f2efbdfc1515795eab697bb2eb59fe7c3d0decafa165568906f8dcda0f8.669dd756a087778276d20bfda5014aa2	\N	\N	\N	client	2025-07-09 18:35:39.293927	2025-07-09 18:35:39.293927	wizard-portal-forest-forest-stellar-light	t	\N	pV3hKheFtsZf
35	swiftowl2290	\N	0ca90c4289115a633712f186e69a945fbe4616db2f6c93dff86a9b5a7d6dff8c400e8e7f60df148220415bb5598446226c2644ccd3bfffe6289dce087aa1bcb0.806d0914e7e8665f23e9bfef5359ed11	\N	\N	\N	client	2025-07-09 18:36:03.650305	2025-07-09 18:36:03.650305	tower-tower-magic-breeze-castle-knight	t	\N	pivSBqTSREZu
36	sony.leo.sony879	sony.leo.sony@gmail.com	033df29ba60cc72997f6dfde500c5c2923723f65103df5d8edc28edc055ecf1c7ffb85f68ea037a8841e0ae1f9edd55557ae81980593ab7d47441ce76d1d01fb.d8d028de924604ce8afc8a13a6012cc3	Humayan	Rosid	\N	client	2025-07-09 18:37:16.955539	2025-07-09 18:37:16.955539	\N	f	\N	Sony@2003x
33	calmlion6748	cloudlite9@gmail.com	7eb6f937096c810b15c34663f6d91d51509db76d15faef2e5aa43f6b0981beb06a231cef8941b0e73df82407d79b3f5acdd834a2de97bde34248330eedeebe75.4d504762d69656511e0ec036afb75102	\N	\N	\N	client	2025-07-09 17:56:12.543888	2025-07-09 18:49:33.039	wonder-storm-forest-breeze-shadow-stellar	t	\N	vKjxn8HJSCZ7
37	laibaqueen892933	laibaqueen892@gmail.com	c640b32008f5db0a96cb559a55f453f336140906b2b45c730723b7f7e117f5cebfebc8acaa7bf077894ab8438d6b91964c688c46bc36902e2d8862c91eaac421.dfceec7d42a78e3ccd9deb8bd764edf7	Laiba	Queen	\N	client	2025-07-09 19:03:27.224928	2025-07-09 19:03:27.224928	\N	f	\N	MalikSahib0@
38	swiftshark8773	\N	1d61debebf7b36550995828090604f65d8bb402e10912c6b93f2cb2ae41a543e5d151fe91b6746e578d6f4537d1d0013827596b4dfe2ddaf5773a1b23ce289f0.fb2a1a7f0c8def5d52a2feb733d4e534	\N	\N	\N	client	2025-07-09 19:16:01.066962	2025-07-09 19:16:01.066962	thunder-river-knight-forest-diamond-quest	t	\N	j8prQtHEX9Vm
39	freefox773	\N	a9ec5ebce3931c80f80c85a42f87815a6a2a4e99a8ce25d8b7b1510d43815bf580d5edbc3a296c7a3fb340403569f863ce745544027e4abf47463416e365a1ce.7c74d763fd9806ef39d068b84fafd991	\N	\N	\N	client	2025-07-09 19:16:29.970862	2025-07-09 19:16:29.970862	dragon-wonder-forest-thunder-wizard-silver	t	\N	fk8TXyZMb9sj
40	freehawk1920	\N	2eac89a532d593c9c33e237b05afcd3fac07cdf721a40968debb385cfa0aa0a6bd38030bc9c0e6bb01bc53b32a8a51a14cb3403134aaf7a6d03f8aeceaf5d5d5.36f58e968cec4e871f4f6f02db497169	\N	\N	\N	client	2025-07-09 19:18:08.644935	2025-07-09 19:18:08.644935	phoenix-shadow-mountain-storm-sunset-dream	t	\N	KZeiSmykqDZy
41	calmfox6208	nadimsiddiqui@gmail.com	df8b3a8042a52c1b8d35af831f12f7f6475d26c0737346e9d49d9f11d8ea7d0983b98254bd75953a4934375524c49e29119a43cc4e42d9d458d8f9ef0496f36b.955dd0473c8a3584a7892596735ff62c	\N	\N	\N	client	2025-07-09 19:20:45.890361	2025-07-09 19:25:32.373	crystal-breeze-silver-diamond-golden-portal	t	\N	EjaVdpPx9mnF
43	aslisona428271256	aslisona428271@gmail.com	3f4e7d34870d154bc39199552e5caad2fc81b483561e4f9d44b1fb9bf4a4fbd87a256a0f0a7efa03e9d3fe6ac41eb310421a75e830684e116cf09df6765dcd47.d836f09374a0e588a2b3899583f04db7	Muhammad	Ali	\N	client	2025-07-09 19:36:36.338776	2025-07-09 19:36:36.338776	\N	f	\N	Hidden11!
42	brightdeer218	bb3823513@gmail.com	be28df5cb6c20e451eb43fa72b3fb385ea0db18e3d82fde59116b3bea2bb543f74626e7842357751d8b30c89230209dc31a7bcce43a8a204e93f39830f0549cf.b7caa2d848fd69112dcfa9a2397e9e37	\N	\N	\N	client	2025-07-09 19:30:11.452538	2025-07-09 19:43:36.272	voyage-stellar-wizard-tower-golden-castle	t	\N	3xpmwrgUHXRK
44	ah0481637973	ah0481637@gmail.com	e3b0a73a22908452779fc70a24613324f9bc23e902168cd3f3bf471a2cb0c360fc7a3fcc9c3cda84d1b2911b8b7b392a46c3e5ca2a12147a61c1650c92c2e55b.769998427b1124865312f07fb4a02c8b	Ali 	Hamza	\N	client	2025-07-09 19:57:07.878698	2025-07-09 19:57:07.878698	\N	f	\N	h1a2m3z4
45	freewolf3551	\N	be01dd4835de6d8258d5ddcc676c0f7e1155fd0c33d1bd0c999fa603209ea9520a9b4e54d3d26ed36aae4434f445d3150683048c28bb1a7b24a0469680b1f2db.602f67c875b23bb4c9b0396915dc13d4	\N	\N	\N	client	2025-07-09 20:10:04.475414	2025-07-09 20:10:04.475414	mountain-storm-magic-mystic-thunder-voyage	t	\N	UVJXJ7ATS26j
60	ubaidraza9199463	ubaidraza9199@gmail.com	25741fb0609c9d5a128e83fa3badc43c1260e4b6042ee7a596c6661a30c0edd189eab2465dc459e955247a003efb6ab152dc6bd007f9b1c7edf2b93e79bc81b9.a35801422b9145f5c8517361fcdd4d5e	Ubaid	Raza	\N	client	2025-07-10 01:04:54.123324	2025-07-10 01:04:54.123324	\N	f	\N	raza3!32
61	quieteagle840	\N	6568670ea1d083ba4d62b3f403766da37730eba2f700711f3ca99525baef84fc80ea50b61d40d2fc80dc12621c884cba9bca5db07c253399a3e6096f92fb79b7.bf64bd28523d6a85d5388aeb1158a09c	\N	\N	\N	client	2025-07-10 01:09:30.16168	2025-07-10 01:09:30.16168	breeze-wonder-forest-voyage-mystic-knight	t	\N	gGfHYrey5NGp
47	quietlion8612	\N	eb17c24b2bf088a176bec4f149490544539fb1c954fe687f8e8768d912f32f3a0722e6e6ad5205945535a4756263085fba42d6b31cbe391fafa611ad35f710b2.109c122bf4a34cfcc097a96b8ec60c70	\N	\N	\N	client	2025-07-09 20:53:40.994499	2025-07-09 20:53:40.994499	castle-silver-dream-thunder-quest-light	t	\N	JmvUUWBDgMpU
48	swiftowl2360	\N	eac6555c824f96ab29619c98a0cdf972618223cea3cb3b792a39fa1410fb3091e5e4f50f1ba18a8cc940afb53ddf1f85a355863e104432a3f9342eafb8128c26.54fc36be02a60a7ad4c1aa656b8e4aba	\N	\N	\N	client	2025-07-09 20:59:57.816796	2025-07-09 20:59:57.816796	portal-diamond-silver-wonder-sunset-mountain	t	\N	fvCjXKeZFcdk
46	calmwolf2322	hurraira10@icloud.com	d401afdd046f88bd17619dab7ebfd035939f9ccd1a25f03ab8f2aec8b1c337b16ce0e5ace102e9b52d8366794229458b938fcd27218457512e24920a8a2e6aa4.7b5c706f1796e63c9a7187f6e293446f	\N	\N	\N	client	2025-07-09 20:33:24.47934	2025-07-09 21:00:02.073	storm-silver-cosmic-silver-crystal-golden	t	\N	JWJbtceRVCbG
49	hostarina259	hostarina@gmail.com	053d390c6f31cbc95d87f8d1997f164fc61d6827d75f1f120a2aeeb08d01c779e1e717cefa84bc41a54c93b667ee96b513eaaddec46db34c96aa2fb9376e8d6b.c7d701f1578cd75bcc9014dbc9675f76	khawar	shahzad	\N	client	2025-07-09 21:02:31.956792	2025-07-09 21:02:31.956792	\N	f	\N	Bc@120201636
50	swiftowl1396	\N	512354c32e904039c337de9042c3507fa209f0b190c713a649d14f351b120478fe5853cc2d8007df43f7f60cb21599b4dce818f7ba768d7a592bb44c683752d3.c0aebbc805f390dd7ffad8de885e69cf	\N	\N	\N	client	2025-07-09 21:03:40.245671	2025-07-09 21:03:40.245671	wonder-ocean-castle-shadow-wonder-silver	t	\N	j4VDw4xi9WwY
51	wisetiger7352	\N	5529c9e5f67aff42e8428e9aa9e1c5c49e81d1a315d2efe5edab59ce2c09cf6217ff1e43e9573e0ba691431724b5c7e20925e90ab21012b62bc363d191611810.3891d9389f614b3bd826bf2659cb3fd7	\N	\N	\N	client	2025-07-09 21:04:23.911249	2025-07-09 21:04:23.911249	knight-light-ocean-knight-ocean-voyage	t	\N	K6GJqV29fjiy
52	calmowl4369	\N	2fea81efed3b5cb8a5c39ca4b1116a149c8e4821fb9cf9ee5f1b59bad67d9f1470e6a6429c074b8b987e9c06a832290565d169d9d3674c2a652298872dabd2f0.988df1cd64ee9738233873993d3b86ce	\N	\N	\N	client	2025-07-09 21:56:07.335884	2025-07-09 21:56:07.335884	wonder-wizard-tower-magic-shadow-tower	t	\N	mrgppwKiJu9h
53	guestmof266	guestmof@gmail.com	e90b65181c25ef1f34549b0f71d1f8b4d770835b5fc164f69ebdb6941b4d12e28ec8aff69df2b1023d5faa874fde3ee6995d8b53f11d1f812c494884d8ecfd56.c5e22d3679b30ae0f7f9fcaf618ccfd4	MOF	Guest	\N	client	2025-07-09 21:59:09.901292	2025-07-09 21:59:09.901292	\N	f	\N	Pk112233..
54	boldeagle3532	r.mallonee@gmail.com	65b32bd94ae0c036d7e401c65bad7e221353190902a2cd1fdf54b2f8153044e858cee455d5fc6e5191f7f698ebd5342dd6356ac634afbdacb355767322904471.4f07cf5ddfe76dd3a01a9adca8da6472	\N	\N	\N	client	2025-07-09 22:00:16.380423	2025-07-09 22:02:55.976	phoenix-shadow-castle-light-forest-ocean	t	\N	Jv6UQyU22vzc
55	swiftdeer8396	\N	2a81af216d48fabade6924ca00c39c31d805d092ace95c348f9e81730f605d946795b0a56a02e8377b3c8fb7f621da87e2e7cf4f1c3f596cd78c8e08664b65be.6206c1bf62376d8925261c41604aad86	\N	\N	\N	client	2025-07-09 22:25:28.651517	2025-07-09 22:25:28.651517	magic-storm-light-shadow-stellar-castle	t	\N	BHBVFhgXtZqd
56	wisedeer4122	\N	db8338519bec8103db4d3a8885f0310a3c775144d131b1b3d5a83773da770a3b4a8d8933a7cd58ae5d08f72bcfec01db7ce08d2f75de5327e5833e8869679af5.a42c005fcd102fc694429f55d900f733	\N	\N	\N	client	2025-07-09 22:25:48.051122	2025-07-09 22:25:48.051122	golden-light-light-cosmic-knight-tower	t	\N	kvRRdnCd2ZPG
57	sharplion4031	\N	a711155eb48d31f265bf136f1678666ad93fd36232396558e38fd0b2e6c2978e5dfa1fbea77574a611c11f26c74ca1a5ed94fb9f57b3155b0ffc7f289463cfb9.5fde23770726418b520da32e0cd8827a	\N	\N	\N	client	2025-07-09 22:29:22.876534	2025-07-09 22:29:22.876534	crystal-stellar-mystic-mystic-magic-light	t	\N	EgMv2EdqFmjy
58	freeowl7117	\N	080c449d739221dba3a518041c95e5e30e21464eb5ce4ad99e6c24d70257f13fdcff5566e303e56e311624294a465feb6c960692be72757bd7e2cd63a24e15f4.e7fd0a2b45520f89d122999a7dc800a9	\N	\N	\N	client	2025-07-09 22:30:18.59924	2025-07-09 22:30:18.59924	magic-mountain-quest-thunder-golden-light	t	\N	3FEJyPGC5MxS
59	khansaadali219659	khansaadali219@gmail.com	006cd25d437a612769c560b9c400c3c0cfc60c6686a4a661220d266a057bdf5361137ddd535c8c18ef4f98816fce1fb489b0d5e887dc0116044fc96b1921ff18.62d5c9729538f479c307aad1136e8b91	Saadi	Khan	\N	client	2025-07-09 22:33:31.87609	2025-07-09 22:33:31.87609	\N	f	\N	Xxxx4321@@@@
62	calmwolf2892	saqibsarwar003@gmail.com	82c5dffc950cc87cfe0ce7504249c96dce3230fad1d93afd5461b590a3d50ae869ee702cac3ebee5f3711cab000996ad1fa02be60a7424e651b26a420980b048.a3ef501d25c24600b6340cb1921f017b	\N	\N	\N	client	2025-07-10 01:32:23.599953	2025-07-10 01:33:55.243	ocean-mountain-thunder-cosmic-quest-light	t	\N	VHCM9UWXnFws
63	brightbear4350	\N	e6537ad8dc25afa8c6dda190e176ffbf23fefe1c8cd913ae7ecb8f3ffabf07898de8b6ad33adae4acb0e69373fd3c58e22537746622ddccb28c9b49e030daf92.1bacb07f745bd9bd55c014576fdc31fc	\N	\N	\N	client	2025-07-10 01:46:20.259599	2025-07-10 01:46:20.259599	dream-breeze-ocean-ocean-tower-stellar	t	\N	uWPkYW5BSCD3
64	swiftdeer1857	\N	503ff4ea75b68b04f62d65b44f00b3a519f8bcbb2605f9da5b5944ce28f6e951a310174d107a8bcf0e195457ba3e933c466837e839df6437f81444223f0070da.7a48941857617c9841962ca19ed3d056	\N	\N	\N	client	2025-07-10 01:47:10.802509	2025-07-10 01:47:10.802509	tower-golden-cosmic-forest-diamond-golden	t	\N	MpqW4GSJszHW
65	sharphawk8261	\N	9809e4a1d8e251eae56603d34c874f8c1e9adcab43f50a328dfa3b5cdcd927855393f79843c60d5e2540661c601e7058383967fbfc8417bdc8c7d8b040f88b1d.5e3d7fb22342b0a71245f03002d2e83d	\N	\N	\N	client	2025-07-10 01:49:02.762608	2025-07-10 01:49:02.762608	mountain-diamond-portal-thunder-quest-light	t	\N	MRF78debiqWw
66	calmwolf4937	\N	5cb256a6f3e2dca2413374a886321953aea5332f82e2f4206722bdd0f706bc40446c5810c5928174f4b3053ab0b1f1a784b1cacd32083d581ea8683947e186ce.e51e3e587bc94845e3120074897e5775	\N	\N	\N	client	2025-07-10 01:50:28.50827	2025-07-10 01:50:28.50827	ocean-crystal-mystic-breeze-storm-knight	t	\N	6hMkeAa6EWSX
67	wisetiger2515	\N	7a43a3392f300e4b03d0db3f0dc5f9de0762c59107d2f38745a0096d45b8aa4fbb2e08ae42c10b6e301db061164bef8bfd2e9c4a086d1462d98fd6a98adb09a8.656c47a24c0a54ac39197810aca8e7c3	\N	\N	\N	client	2025-07-10 02:02:10.552643	2025-07-10 02:02:10.552643	portal-storm-golden-stellar-cosmic-ocean	t	\N	5mJdVZVtKZr5
68	swiftshark4477	\N	0bf93f9e9da902d1ed2c9e838e28ddebd66f97c44800ba532841598f2efcf8a079e5f9af1accfc055321902efef92f22a4e911a00ed109fbae009d09e4c7335d.217edbbda6680ad9798008197b57e664	\N	\N	\N	client	2025-07-10 02:07:33.128967	2025-07-10 02:07:33.128967	stellar-storm-shadow-castle-cosmic-forest	t	\N	QzWmD7B8ay92
128	web39566	admin@hencloud.hostme.today	qQ$KTM3x4j*n	Anonymous	User	\N	client	2025-07-11 21:52:50.575724	2025-07-11 21:52:50.575724	banana-happy-happy-happy	t	\N	qQ$KTM3x4j*n
69	2266106746	2266106@gmail.com	2c900ca720f8118621c66a781c9169133111a0ddf5de10e3ec7189553d8da083f026bbcc8c696b0ae2544e8a1a64312f08b1436f5cd82c3e7a10c99c35a32591.4178c49301e9d6d761d7d3a56aa780ab	Abdul	Latheef	\N	client	2025-07-10 02:10:30.279673	2025-07-10 02:10:30.279673	\N	f	\N	password
70	Sanjaykumarprajapati70396	Sanjaykumarprajapati70@gmail.com	ca4ff85cec47862f9b764fc3a31f8fe0a872a4f34cf7fd0a762836836bed90c0726aa60a1e17d93a5f0a60b7dbfd3df10cbeef478bbe454070e24e2c569ac508.b97ec6ed5ca8ac31a307c3c42c06ac2e	SANJAY	PRAJAPATI	\N	client	2025-07-10 02:10:40.818325	2025-07-10 02:10:40.818325	\N	f	\N	Lucknow@123#
71	cleverhawk5749	\N	3454090fbb499fad71fb6586da2264aab0d92b71bcab96debd9ff8c63d540194572c237a67393d5d41de1b57c4bf2a54e5d28fea593b6f327e98b926bea7f9d4.89d3b30f07f055413daf162a42fbd472	\N	\N	\N	client	2025-07-10 02:19:07.642795	2025-07-10 02:19:07.642795	stellar-phoenix-mystic-silver-knight-magic	t	\N	K4SpBt9V5iDF
72	quietwolf6317	\N	2963325db622dedcb73c66dca7cf431127ed6c2962107bd3bf0fd26eed7139aad29c661a8a5d7bfea96efa7a7ac6473aa77395ecb817d152cfd540fa03aee8cc.2d4154e434954401b328c1cb24f868f5	\N	\N	\N	client	2025-07-10 02:20:17.234499	2025-07-10 02:20:17.234499	dream-bridge-crystal-dream-river-thunder	t	\N	dxd7RJNef8Mr
73	boldhawk7435	\N	b583243ccdb4af5270377c27d9aa9280153cf762845b859660b9657fd80e37860aadc2c35abe880578584c11c864bd3f097b49027eb18bc782173067d88d4bf4.6d689dfd45a09d46951982100a2d2945	\N	\N	\N	client	2025-07-10 02:23:17.789325	2025-07-10 02:23:17.789325	light-cosmic-diamond-diamond-dream-phoenix	t	\N	BVa8Ej8VmPQR
74	braveeagle7016	\N	82cad9e9c77be41cef6e5c3c4a3ba08d96340869326bf4650c125d2a51e6845ddcebcce4e5baf2a23a96a6dae32db79692f726b2e2dd63e9ce799722935b2075.1c2ff3239d6ac0d9632dea538852c527	\N	\N	\N	client	2025-07-10 02:26:31.686073	2025-07-10 02:26:31.686073	portal-tower-portal-diamond-golden-shadow	t	\N	3NrnhEA52JWG
75	bravetiger300	\N	18917042f3f3a5f9d53876088ae7c45dc9999efaa6f49b30f707f09ee90f548c8dd76b987d18236b8bab59ba6df9b5a292f2a061c458084a7fc5d7f112cf32f2.ca0e829b971f6195ee612fbe81e27aec	\N	\N	\N	client	2025-07-10 02:28:50.499432	2025-07-10 02:28:50.499432	stellar-magic-mountain-wonder-magic-mountain	t	\N	HdhvYHEE2rXi
76	bravelion5422	\N	dbf51793ed1ac159a71d0aa797547a3bec97929dc3b087ff88efb8be9280568febf62ac87580330806c3ae9653582d1bc84ecd9df6f7ba2594832a77f9a016d0.9815156f534443e0ff1925e38e91491c	\N	\N	\N	client	2025-07-10 02:56:49.047363	2025-07-10 02:56:49.047363	shadow-sunset-breeze-thunder-bridge-dream	t	\N	QMNCE2R9ZuyT
77	calmeagle1780	\N	05a4e12da93a4b34f32fb0117c71225a592088f6e14f0232db486264bd49e476c9c585ebed1dbf32b1fb2cc0cd179be331d836ff9d4d5dbcac0c760e82e6183d.7d1c057b563c9b75afdd90c1d457b00a	\N	\N	\N	client	2025-07-10 03:17:21.553767	2025-07-10 03:17:21.553767	voyage-breeze-dream-phoenix-diamond-light	t	\N	sCXmipAVMNra
78	cleverwolf397	\N	f045cacae015d06a2486d7c0776bcb2ad78d49f9c12aa901d6d2d502bd049cdc34e24b816ef5bce07a124aa1375bbdc06cd761a04289c6b2dfb8f1cb49c46d0c.c73aac606f5b6dae8d4847c774362d8d	\N	\N	\N	client	2025-07-10 03:32:10.608496	2025-07-10 03:32:10.608496	silver-thunder-river-sunset-thunder-tower	t	\N	EE7jrj4ejivq
79	admin327	admin@superdosts.com	4b7674e165cd2c602c809a60c7012cc2358cb8585e387c971aefd45cc77aff24ec41ff3114e7179ce89d69c722c95191d01b5d8a6dcd09ed470fa4ea210347cd.3d00c84e3ed66db5077920afda2c8078	Manoj	Bhat	\N	client	2025-07-10 03:32:58.519074	2025-07-10 03:32:58.519074	\N	f	\N	Superdosts@456
80	braveowl6767	\N	99e8121bc51e24359508406129d057e697e1d8faab936f8aeceac804e1264dcdbb154118f1bd5a8984bd5e137d6814a7a1a70d0af0e3f6a0b775bf7ab9442dea.28d91920cfe43ded81c42b76ba9e0ae3	\N	\N	\N	client	2025-07-10 03:38:31.745396	2025-07-10 03:38:31.745396	sunset-voyage-river-tower-magic-castle	t	\N	KhjthbBhPyaC
81	bravewolf6052	\N	e472ec759fe87ccfb335f807179dc6d3bf40bb149d2ca8f203e63fa38b62d81faf6b2666ed6f99912e620ab6840af09cc497c89c31ca55717f1409242f32efa5.529bac5d5f92a90bdfaf749af476cf4a	\N	\N	\N	client	2025-07-10 03:39:18.680397	2025-07-10 03:39:18.680397	stellar-breeze-wizard-bridge-light-light	t	\N	u5paqm3ADaEi
82	quietdeer2461	\N	7eaabe031c52713d36381bcc22e14deaccf42a264965477d1a29d1be05b8309b3188a32635279e6658e2e7379ad39ab512e2fd8d172bf2ccba06ad5e0b7ffc9a.d8f318e29b91beef2d0d06fa16501e64	\N	\N	\N	client	2025-07-10 03:40:47.510365	2025-07-10 03:40:47.510365	golden-mystic-forest-mountain-dragon-shadow	t	\N	9UyZmg2mu44q
83	multitoolspoint994	multitoolspoint@gmail.com	c1192aac18e3cf0ca76cf74dc8030fe2dd1756b331e266224f85504c1b28a27a83c4459bb24d035acf6f36a872de6508104cfa307bcde05100e3444e8170a1f7.4cfee3de490e5282e5f34f5172ac2555	Haider	Khan	\N	client	2025-07-10 03:41:03.402469	2025-07-10 03:41:03.402469	\N	f	\N	Hero1234
84	freefox3043	\N	241b2350a345d461962c4d38acda0c4594bd202c4bdef1f206bd3a79bc3e9967c8273a6d926dfdc107d86f03297da9e291b69badc5448fa56fab3d07570baf15.fb4a8b2a0c3aa00c284db22db867c942	\N	\N	\N	client	2025-07-10 03:43:47.317028	2025-07-10 03:56:37.866	cosmic-storm-quest-phoenix-phoenix-quest	t	\N	e6Sq5aXeZags
85	brightdeer8346	\N	a95edeca585d676e3cbafe0a1f659cb12724622686d3e853869fcd6c1f5cc0abcdf5baa4139c0dc4611dc1fb9a1f8d0eb8d58b08e01ff08b1269e9972343b66e.2e83df9063c7cc1ef080eda7c6a8435d	\N	\N	\N	client	2025-07-10 03:58:43.080092	2025-07-10 03:58:43.080092	diamond-dragon-quest-dragon-magic-shadow	t	\N	JwvKhTJtndmS
86	boldfox4829	\N	e49fe74a5bf623bf603533d0226bd79cf24b520811db4127effd49cb27891de1c5ebde4f2f91fc4b8e1fcb60ad5605cf837ace44673414f2c4214b9735bf5b03.dfe210aa16d9e14a8f292c5eae83dd57	\N	\N	\N	client	2025-07-10 04:07:41.161544	2025-07-10 04:07:41.161544	portal-shadow-mystic-voyage-stellar-silver	t	\N	ZrdFGWKMJeHD
87	calmowl7730	\N	deeeef4d287a167820ae269dafa5abe0eb2935b64eaf58f41d3c739acfe8a1e346ef404f38de1f83cf782647673b627e22724271fef6e153d22d7ac29af26e19.74be4461f6e2c33ff24f1da6d6a85d92	\N	\N	\N	client	2025-07-10 04:13:05.880624	2025-07-10 04:13:05.880624	forest-stellar-castle-forest-golden-quest	t	\N	iJtnR82jWXUP
88	clevereagle8392	\N	21ab5114d5fa71365fc2d654a96c5a1042525db26e2a5c2d19040ebbbd6c224ede041cbe8c11ae172bc5b63e5b6c2b36a4e82e1a13adab8e895ac5f2133cd583.cfbf4c816922243f8c25423537c07f36	\N	\N	\N	client	2025-07-10 04:13:32.520202	2025-07-10 04:13:32.520202	light-light-tower-forest-crystal-storm	t	\N	kfqqWjePnaCC
89	brightowl9098	\N	37025fe0a7d21040681ed7a114fef8dd35c6bcb79c84d4515769d883c4d58e02e5c756a333fd4743fc7bc00140fdd589435f3d123fd7ee0af745fcf0e704f2af.9a1b78569b5562b667db86315a919be9	\N	\N	\N	client	2025-07-10 04:14:20.098578	2025-07-10 04:14:20.098578	ocean-voyage-sunset-portal-dragon-mountain	t	\N	YQJjPaNxxTEm
90	wisebear5378	\N	467658eb332e9909d08bae0de928acd32538cf548898cebd7ea35115c4626ea46cf8096367816665bf6fd6e7e7cc714ada91b4098cc7ba29f3bfe6f475cbb080.7735b94a4a8ec5ff5b36747ec29d424b	\N	\N	\N	client	2025-07-10 04:14:40.686996	2025-07-10 04:14:40.686996	stellar-magic-wizard-shadow-forest-magic	t	\N	xfK5XT7VuNWn
91	sanjeevindia94242	sanjeevindia94@gmail.com	0075eff48fb55e03020046f7d5e29396503a4bb854e9bb57d0d81f3551f4e236daa53d3f1e66dff92b63453079e517ec35e312a317651ec35dc35bf6fc34be7d.330252e02ca2188d7d8aa1a1b33fe065	Sanjeev	Kumar	\N	client	2025-07-10 04:15:09.725879	2025-07-10 04:15:09.725879	\N	f	\N	8650San@
92	brightbear6219	\N	de2a58a49760e9db0138b36e7e0a31ac2cb8a9f9838339bef1907481fbeb0494ab89cfeeac1ca50dc6f4d436741d10eb70f4e84a61598d95848ee146b519bbb1.5cdc6d8fc6117a9343353107e5acb94f	\N	\N	\N	client	2025-07-10 04:15:43.475968	2025-07-10 04:15:43.475968	diamond-quest-bridge-mountain-portal-portal	t	\N	SzZjaHBQfXu6
93	quietdeer4008	\N	4451fc58f596056915898a760009bf7a3763abe644263d885de24332b5f2c1d20f38b906330d659102dcdeb8368c283bd409d72809e9ce2d4178cdc69aa2ecde.66ffa961e5ff399b464240d2a59010e6	\N	\N	\N	client	2025-07-10 04:16:24.783168	2025-07-10 04:16:24.783168	dream-golden-magic-knight-wizard-tower	t	\N	Gh7GGpAKiJUN
94	Solo95bgmi857	Solo95bgmi@gmail.com	273568d36ea75de2a14a78611909be24a6be144031ffe54d5051f46e53ba68a45aadd350729f448df5b4d03a2806da3ec9583722e2bd0375c0e8a45f6f514505.ef4ff71486248df4004bce0ef936df03	Yash	Xx	\N	client	2025-07-10 04:18:10.821801	2025-07-10 04:18:10.821801	\N	f	\N	CPanel2025
95	shabby790504	shabby790@gmail.com	cd0721c86ef97f795f84374026ac4dfb1277607379ebeffc5ea0602f4991a3e6a4938fe765ad1a82f5a8a52e887c0382e5241cec28688c3a3e25e7a48d7f7558.b364e01ccc8e830de5b668197696f8d1	Shahbaz	Ali	\N	client	2025-07-10 04:30:30.700283	2025-07-10 04:30:30.700283	\N	f	\N	$#Pakistan@@321
96	wetestpayment658	wetestpayment@gmail.com	8f3d0d8a35a09980849ae6040fc67965dc277f900a0eb7e64d6b1f1a158fbe53bead1c82e45cd880be8c0a3b98699b0801cf062520925966a30355a1a042aa42.bcb50e50c66950473c34c69621fba9a3	jwkkwkww	lkwlwlwl	\N	client	2025-07-10 05:03:30.912055	2025-07-10 05:03:30.912055	\N	f	\N	gAqwud-7mihvu-jitdok
97	thinkonline.in795	thinkonline.in@gmail.com	ca24bcd304f6ba9d7324dfa2ce1ec91f95a0772210ee8a6d00d4570c8b3c795282179415259bcaa3491aafe0324b0c12ed7d623dc466a19585b66b2adf318d45.486d4fbbe44ebc0b2ca929a6b2a8c20d	Pranav	Sharma	\N	client	2025-07-10 05:24:29.131324	2025-07-10 05:24:29.131324	\N	f	\N	1234@1234
98	khanshadab855925	khanshadab855@gmail.com	a2764ea16bb7f5af9430a84a6228bee958e9133c6a9869734167255427ec9c40b003e11c27ae0d84cdbe5105d618e180aafbd2a855e91fda267e7393b4526bc9.9287e1086bf8250c5b312116f80d726b	Shadab	Akhtar	\N	client	2025-07-10 05:26:14.013033	2025-07-10 05:26:14.013033	\N	f	\N	Shadab@#9304
99	mekhelm27442	mekhelm27@gmail.com	d82db7819f1e6dc56a635c2dc29d03a68e42cdab585fb02b614b15b149130fb3126903e08b50bff9a78bd4dcd35927b6edfb89761d4fb3af2ff2f483bf659437.a7c68d6ba2f76c967943574a72c6305d	Namit 	Sagar 	\N	client	2025-07-10 05:32:34.160247	2025-07-10 05:32:34.160247	\N	f	\N	Dittons
100	nayekpitam6449	nayekpitam6@gmail.com	82604aa54a7a5a120cfd55d86050f8f6b51e277cf455a05135a205f26e1d124856356b479a947569419abbd49baa5166ed321f2ce2922682879a4a0f61fda91b.b3a4532d644e0993a4e958171023c7ea	Pitam	Nayek	\N	client	2025-07-10 05:34:32.874373	2025-07-10 05:34:32.874373	\N	f	\N	pitam1234567890
101	swifttiger3146	\N	1b8e0bf8f5d79b14e34bb5a93af854286346ba0a0f07f2a327bd789636b97807f6f636d3976a98871b00bf0662fdf1bd7de663a38bc236d7f69ba64273062219.bc412b70e444dd4250a1d9e464f10d1d	\N	\N	\N	client	2025-07-10 05:50:30.240898	2025-07-10 05:50:30.240898	tower-light-silver-river-thunder-tower	t	\N	yzag9Wy9CNqt
115	olwambuntsadnvp1	olwambuntsa@gmail.com	asHello14	Olwam	Buntsa	\N	client	2025-07-11 14:55:50.700138	2025-07-11 14:55:50.700138	\N	f	\N	asHello14
103	wiseshark5103	\N	a241b973ed373c4cab6a0fd955f60a483b2180da7858ad1911824510a96f64b7df85f8d7cc5e070415c3dcc53cec28f87712c38603c7fee925913f6905cef776.a3fd8d6829df7eb983615a5e8bc8ac9f	\N	\N	\N	client	2025-07-10 06:03:54.127002	2025-07-10 06:03:54.127002	portal-voyage-crystal-golden-dream-phoenix	t	\N	e2fPdq3ydynb
104	routhugovindraju8830420	routhugovindraju8830@gmail.com	f3209aabf9c5f40f92f711a432fa817adb8d85e981dd247d561b6eaaf930074dd90c4170d1951081aa2882ad2c08d1ad2f283cc90023cbc65eb67d8f6fcf1761.0e44ff08ff7c028ea6c3115ae346a99d	routhu govind	raju	\N	client	2025-07-10 06:06:06.821964	2025-07-10 06:06:06.821964	\N	f	\N	Black_8830
105	swiftdeer5499	\N	20a72b1502eb2ea88d5396ec54ad64c72960633f3b9fd130af1597f7cc3fe92afaedf59116a6f68f5d5a27da48eb1aa58caafdc737634a9c9c69dc4f4d66c35b.b0d989f450d767abe45190bb622e2e31	\N	\N	\N	client	2025-07-10 06:06:44.885972	2025-07-10 06:06:44.885972	dragon-shadow-diamond-stellar-forest-quest	t	\N	xh76Uv5EfyBw
106	bravehawk3735	\N	d191de41351605de6356343e1578b05f7202d1b00ec6f2540632a42eec809846d26e8a884df61773880ff3bf50dd145a1c76c7d67f92a0d1b4ac89f7fc5179df.b01edaf7388522f6929364234439c12b	\N	\N	\N	client	2025-07-10 06:07:41.709644	2025-07-10 06:07:41.709644	bridge-sunset-diamond-stellar-light-light	t	\N	D8t7dHMWqjpH
107	bappabiswas2300120	bappabiswas2300@gmail.com	db6108337a5bc82e02d7e81ca536d7fad2928c8df4ccbc8333c434c7cf834162d4de29c733cadfeca3be012f3787b4fa35288d5e3e2bb1a719b9104e76da3be4.d0f40844b03dd04544d93226e7e54af6	Bappa	Biswas	\N	client	2025-07-10 06:08:46.767698	2025-07-10 06:08:46.767698	\N	f	\N	Bappa123
108	calmshark1771	\N	4467ffff73a4d48ed14ef28696b00354034a83e02baf70a57161103dfa7d4708b50213a62c1dca54743472f2a36a397c65a1d4ddbaa28c29292d417bac99c3a3.030f56f94d390f9734f01b1105f0a6bb	\N	\N	\N	client	2025-07-10 06:16:38.431627	2025-07-10 06:16:38.431627	light-breeze-diamond-mystic-silver-crystal	t	\N	qGAnqjKUzNPS
109	calmbear1426	\N	72ba2430a58d2bb8d02d7f62ec3b1f7745dfde66b37d5bd326e85daa40614535e587fd224f4a9f5ea0fb844edab9586ad8508025f7001143fe5d2e4111762171.116aabcf3d92cc467f5bbc6257acce45	\N	\N	\N	client	2025-07-10 06:17:52.664712	2025-07-10 06:17:52.664712	storm-forest-crystal-silver-silver-crystal	t	\N	uPPWyvS7uHaF
110	brighteagle3021	biswasbappa710@gmail.com	8da0de6ab1ff16c811f37a1501f29997484d8a5a1f67386c1466d2d0de9b0bf75a67ff37b1d7567ae4fe231b90148bfae63a0ca93c37e612dee754e86068b72d.297f6ca13fe28bb9eea91b3c127b8bbc	\N	\N	\N	client	2025-07-10 06:22:31.475904	2025-07-10 06:24:17.17	voyage-phoenix-storm-magic-castle-crystal	t	\N	QNBeJtM4Nmes
111	calmhawk8728	\N	e658d7c874bd48f5905758e308905d136a9a66f5ebe0ab470e54c13a511024b4870284b7c0b0ec0b132e4288721cd226172794c1737fd662c393049c07a0e18a.088962229aa8cff7000dd140a69e0788	\N	\N	\N	client	2025-07-10 06:27:50.94515	2025-07-10 06:27:50.94515	dream-sunset-portal-wonder-crystal-voyage	t	\N	vMUbrpvNwGQE
116	yanebek994tr0iw	yanebek994@lhory.com	Abc@12345	dan	ja	\N	client	2025-07-11 15:38:03.434108	2025-07-11 15:38:03.434108	\N	f	\N	Abc@12345
112	cleverfox6723	annukumaribth98653@gmail.com	a3b0fb66fd625d92a4a90e288bbaf26fd7953ac53061fa26d9e96e8168c0b00fd84adfa879c16daad7bede5b4b70fdc4792c601db47ad40bac90e19b22be490a.ef364f9c23bc9a53e22fb347a57bc7bb	\N	\N	\N	client	2025-07-10 12:33:56.902718	2025-07-10 12:38:26.752	dragon-forest-thunder-diamond-breeze-diamond	t	\N	VM6ayzas4hrm
113	perfection.prakash712	perfection.prakash@gmail.com	343792f5ca9e101673f1b8bf22620a29f5baa6013cb8aab24eccf60c3690b3aedabf8843286e8d281a084f971f375473ffe3ee974ca82f9171bfed9b4379bb16.87b502228bc075ec067dea070315a4c1	Prakash	Prajapati	\N	client	2025-07-10 13:25:38.536503	2025-07-10 13:25:38.536503	\N	f	\N	miracle@1028
114	shine.beef.hat479	shine.beef.hat@staycloaked.com	0103f4c8c67e7091eb0e9d16169d6be45236efec7bf608aa0da4015d8b328166a0eea592ee7afe9e3a0c5968e763fb7b982ea0814004a35324099dd6a0e5d34b.31129e037f43210a601ae21c870579a0	Robin	hood	\N	client	2025-07-10 14:44:48.647234	2025-07-10 14:44:48.647234	\N	f	\N	Fre3de3r
102	sharpshark921	sreenivasadyourworld@gmail.com	d412aa5272a78eda23c6da768086d07b810e54d8436dea9abd46470519e83bbc870a1579b45b8c983bae61151bd5a3b380e5fb36db65ee111ec8274ac6b03758.561496e9bad8b646379a44210b120b3b	\N	\N	\N	client	2025-07-10 05:58:44.034724	2025-07-11 13:14:10.545	golden-breeze-mystic-dragon-portal-bridge	t	\N	XfD7dVKBpXqx
117	host6844	admin@spaceman.hostme.today	gNPDiiLz1cX@	Anonymous	User	\N	client	2025-07-11 15:54:20.766836	2025-07-11 15:54:20.766836	happy-dragon-cherry-cherry	t	\N	gNPDiiLz1cX@
118	user55177	admin@spaceman2.hostme.today	DycAAy6aOSiG	Anonymous	User	\N	client	2025-07-11 16:00:09.35574	2025-07-11 16:00:09.35574	banana-happy-forest-garden	t	\N	DycAAy6aOSiG
121	my40619	admin@spaceman5.hostme.today	W4jf6IKcf3bm	Anonymous	User	\N	client	2025-07-11 16:17:03.017703	2025-07-11 16:17:03.017703	apple-jungle-jungle-jungle	t	\N	W4jf6IKcf3bm
122	my10403	admin@spaceman6.hostme.today	Q4I^2kW!q$uh	Anonymous	User	\N	client	2025-07-11 16:34:38.253272	2025-07-11 16:34:38.253272	jungle-dragon-forest-jungle	t	\N	Q4I^2kW!q$uh
123	site76096	admin@spaceman7.hostme.today	^1F%MIKk77aw	Anonymous	User	\N	client	2025-07-11 16:41:12.516719	2025-07-11 16:41:12.516719	eagle-jungle-garden-eagle	t	\N	^1F%MIKk77aw
124	user37594	admin@spaceman8.hostme.today	W7ZYDIp9uc72	Anonymous	User	\N	client	2025-07-11 16:45:22.297199	2025-07-11 16:45:22.297199	forest-cherry-happy-island	t	\N	W7ZYDIp9uc72
125	web84595	admin@sahaniji.hostme.today	EYV6a3@yYK8S	Anonymous	User	\N	client	2025-07-11 17:40:11.287981	2025-07-11 17:40:11.287981	forest-garden-forest-eagle	t	\N	EYV6a3@yYK8S
126	web11197	admin@spaceman9.hostme.today	ZlqAI6xoD%nY	Anonymous	User	\N	client	2025-07-11 18:01:25.405674	2025-07-11 18:01:25.405674	garden-banana-cherry-eagle	t	\N	ZlqAI6xoD%nY
127	web35220	admin@spaceman10.hostme.today	BGtHQvc*t&kA	Anonymous	User	\N	client	2025-07-11 18:10:16.084588	2025-07-11 18:10:16.084588	forest-dragon-island-happy	t	\N	BGtHQvc*t&kA
129	host71526	admin@poker.hostme.today	Xqq2JuLz^mkP	Anonymous	User	\N	client	2025-07-11 23:52:25.843461	2025-07-11 23:52:25.843461	happy-forest-island-jungle	t	\N	Xqq2JuLz^mkP
\.


--
-- Data for Name: vps_instances; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.vps_instances (id, user_id, package_id, instance_name, ipv4_address, operating_system, status, stripe_subscription_id, stripe_customer_id, subscription_status, root_password, ssh_keys, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: vps_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.vps_orders (id, customer_email, customer_name, package_id, operating_system, status, stripe_subscription_id, stripe_customer_id, subscription_status, package_name, package_price, vcpu, memory, storage, server_ip_address, server_ssh_port, server_rdp_port, server_username, server_password, server_ssh_key, server_notes, processed_by, processed_at, created_at, updated_at) FROM stdin;
1	test7@example.com	\N	1	ubuntu-22.04	pending	sub_1Rif0cRxDoUeGEPbCFzmevNy	cus_SdwuUCkMTM0oqL	incomplete	Basic VPS	350	0.5	512MB	20GB	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-08 17:08:47.593139	2025-07-08 17:08:47.593139
2	ceo@openweb.co.za	\N	2	ubuntu-22.04	pending	sub_1Rif3YRxDoUeGEPbGY5GurxL	cus_Sdwxbh4ZOvqyhr	incomplete	Standard VPS	500	1.0	1024MB	40GB	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-08 17:11:49.693526	2025-07-08 17:11:49.693526
3	ceo@openweb.email	\N	1	ubuntu-22.04	pending	sub_1Rif7WRxDoUeGEPbMG0btiJI	cus_Sdx113NGW9aijE	incomplete	Basic VPS	350	0.5	512MB	20GB	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-07-08 17:15:55.882877	2025-07-08 17:15:55.882877
\.


--
-- Data for Name: vps_packages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.vps_packages (id, name, display_name, description, price, currency, vcpu, memory, storage, additional_storage, ipv4_addresses, traffic_port, os_choices, is_anonymous, stripe_price_id, is_active, sort_order, created_at, updated_at) FROM stdin;
1	basic	VPS 3	Perfect for light workloads and development	300	USD	0.5	512	20	0	1	100Mbps	[{"value":"ubuntu-22.04","label":"Ubuntu 22.04 LTS"},{"value":"debian-12","label":"Debian 12"}]	f	price_1RieJgRxDoUeGEPblY1vZc5E	t	1	2025-07-08 15:04:38.796047	2025-07-09 13:07:16.361
2	standard	VPS 5	Great for small applications and websites	500	USD	1.0	1024	40	0	1	250Mbps	[{"value":"ubuntu-22.04","label":"Ubuntu 22.04 LTS"},{"value":"debian-12","label":"Debian 12"},{"value":"win-2025","label":"Windows Server 2025"}]	f	price_1RieTBRxDoUeGEPbdl6X7Wht	t	2	2025-07-08 15:04:38.796047	2025-07-09 13:07:28.397
3	professional	VPS 10	High-performance for production workloads	1000	USD	2.0	2048	150	0	1	1Gbps	[{"value":"ubuntu-22.04","label":"Ubuntu 22.04 LTS"},{"value":"debian-12","label":"Debian 12"},{"value":"win-2025","label":"Windows Server 2025"}]	f	price_professional_vps	t	3	2025-07-08 15:04:38.796047	2025-07-09 13:07:39.8
4	enterprise	VPS 15	Maximum performance for demanding applications	1500	USD	4.0	4096	200	1024	1	1Gbps	[{"value":"ubuntu-22.04","label":"Ubuntu 22.04 LTS"},{"value":"debian-12","label":"Debian 12"},{"value":"win-2025","label":"Windows Server 2025"}]	f	price_enterprise_vps	t	4	2025-07-08 15:04:38.796047	2025-07-09 13:07:51.7
5	enterprise_2	VPS 20	Ultra Big, Ultra Fast, Prime VPS	2000	USD	4.0	6144	500	1535	1	1Gbps	[{"value":"ubuntu-22.04","label":"Ubuntu 22.04 LTS"},{"value":"debian-12","label":"Debian 12"},{"value":"win-2025","label":"Windows Server 2025"}]	f	price_enterprise_vps_copy_1752066956838	t	5	2025-07-09 13:15:56.868583	2025-07-09 13:17:14.318
\.


--
-- Name: api_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.api_settings_id_seq', 5, true);


--
-- Name: custom_header_code_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.custom_header_code_id_seq', 1, true);


--
-- Name: device_fingerprints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.device_fingerprints_id_seq', 1, false);


--
-- Name: domain_search_cache_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.domain_search_cache_id_seq', 1, false);


--
-- Name: donations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.donations_id_seq', 2, true);


--
-- Name: facebook_pixel_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.facebook_pixel_settings_id_seq', 1, true);


--
-- Name: hosting_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.hosting_accounts_id_seq', 134, true);


--
-- Name: hosting_packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.hosting_packages_id_seq', 3, true);


--
-- Name: package_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.package_usage_id_seq', 2, true);


--
-- Name: pending_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pending_orders_id_seq', 1, false);


--
-- Name: plugin_downloads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.plugin_downloads_id_seq', 51, true);


--
-- Name: plugin_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.plugin_requests_id_seq', 3, true);


--
-- Name: plugins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.plugins_id_seq', 5, true);


--
-- Name: premium_hosting_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.premium_hosting_orders_id_seq', 1, false);


--
-- Name: smtp_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.smtp_settings_id_seq', 2, true);


--
-- Name: stripe_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stripe_settings_id_seq', 1, true);


--
-- Name: user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_groups_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 129, true);


--
-- Name: vps_instances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.vps_instances_id_seq', 1, false);


--
-- Name: vps_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.vps_orders_id_seq', 3, true);


--
-- Name: vps_packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.vps_packages_id_seq', 5, true);


--
-- Name: api_settings api_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.api_settings
    ADD CONSTRAINT api_settings_pkey PRIMARY KEY (id);


--
-- Name: custom_header_code custom_header_code_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.custom_header_code
    ADD CONSTRAINT custom_header_code_pkey PRIMARY KEY (id);


--
-- Name: device_fingerprints device_fingerprints_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.device_fingerprints
    ADD CONSTRAINT device_fingerprints_pkey PRIMARY KEY (id);


--
-- Name: domain_search_cache domain_search_cache_domain_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.domain_search_cache
    ADD CONSTRAINT domain_search_cache_domain_key UNIQUE (domain);


--
-- Name: domain_search_cache domain_search_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.domain_search_cache
    ADD CONSTRAINT domain_search_cache_pkey PRIMARY KEY (id);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);


--
-- Name: facebook_pixel_settings facebook_pixel_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.facebook_pixel_settings
    ADD CONSTRAINT facebook_pixel_settings_pkey PRIMARY KEY (id);


--
-- Name: hosting_accounts hosting_accounts_domain_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.hosting_accounts
    ADD CONSTRAINT hosting_accounts_domain_unique UNIQUE (domain);


--
-- Name: hosting_accounts hosting_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.hosting_accounts
    ADD CONSTRAINT hosting_accounts_pkey PRIMARY KEY (id);


--
-- Name: hosting_packages hosting_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.hosting_packages
    ADD CONSTRAINT hosting_packages_pkey PRIMARY KEY (id);


--
-- Name: package_usage package_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.package_usage
    ADD CONSTRAINT package_usage_pkey PRIMARY KEY (id);


--
-- Name: pending_orders pending_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pending_orders
    ADD CONSTRAINT pending_orders_pkey PRIMARY KEY (id);


--
-- Name: plugin_downloads plugin_downloads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_downloads
    ADD CONSTRAINT plugin_downloads_pkey PRIMARY KEY (id);


--
-- Name: plugin_requests plugin_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_requests
    ADD CONSTRAINT plugin_requests_pkey PRIMARY KEY (id);


--
-- Name: plugins plugins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT plugins_pkey PRIMARY KEY (id);


--
-- Name: plugins plugins_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT plugins_slug_unique UNIQUE (slug);


--
-- Name: premium_hosting_orders premium_hosting_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.premium_hosting_orders
    ADD CONSTRAINT premium_hosting_orders_pkey PRIMARY KEY (id);


--
-- Name: sessions session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: smtp_settings smtp_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.smtp_settings
    ADD CONSTRAINT smtp_settings_pkey PRIMARY KEY (id);


--
-- Name: stripe_settings stripe_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stripe_settings
    ADD CONSTRAINT stripe_settings_pkey PRIMARY KEY (id);


--
-- Name: user_groups user_groups_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_name_key UNIQUE (name);


--
-- Name: user_groups user_groups_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_name_unique UNIQUE (name);


--
-- Name: user_groups user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_groups
    ADD CONSTRAINT user_groups_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_recovery_phrase_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_recovery_phrase_unique UNIQUE (recovery_phrase);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: vps_instances vps_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vps_instances
    ADD CONSTRAINT vps_instances_pkey PRIMARY KEY (id);


--
-- Name: vps_orders vps_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vps_orders
    ADD CONSTRAINT vps_orders_pkey PRIMARY KEY (id);


--
-- Name: vps_packages vps_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vps_packages
    ADD CONSTRAINT vps_packages_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_device_fingerprint_hash; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_device_fingerprint_hash ON public.device_fingerprints USING btree (fingerprint_hash);


--
-- Name: idx_device_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_device_user_id ON public.device_fingerprints USING btree (user_id);


--
-- Name: device_fingerprints device_fingerprints_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.device_fingerprints
    ADD CONSTRAINT device_fingerprints_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: donations donations_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: hosting_accounts hosting_accounts_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.hosting_accounts
    ADD CONSTRAINT hosting_accounts_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.hosting_packages(id);


--
-- Name: hosting_accounts hosting_accounts_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.hosting_accounts
    ADD CONSTRAINT hosting_accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: package_usage package_usage_hosting_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.package_usage
    ADD CONSTRAINT package_usage_hosting_account_id_fkey FOREIGN KEY (hosting_account_id) REFERENCES public.hosting_accounts(id) ON DELETE CASCADE;


--
-- Name: pending_orders pending_orders_processedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pending_orders
    ADD CONSTRAINT "pending_orders_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES public.users(id);


--
-- Name: plugin_downloads plugin_downloads_plugin_id_plugins_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_downloads
    ADD CONSTRAINT plugin_downloads_plugin_id_plugins_id_fk FOREIGN KEY (plugin_id) REFERENCES public.plugins(id);


--
-- Name: plugin_downloads plugin_downloads_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_downloads
    ADD CONSTRAINT plugin_downloads_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: plugin_requests plugin_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugin_requests
    ADD CONSTRAINT plugin_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: plugins plugins_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT plugins_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: premium_hosting_orders premium_hosting_orders_processedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.premium_hosting_orders
    ADD CONSTRAINT "premium_hosting_orders_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES public.users(id);


--
-- Name: users users_user_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_user_group_id_fkey FOREIGN KEY (user_group_id) REFERENCES public.user_groups(id);


--
-- Name: vps_instances vps_instances_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vps_instances
    ADD CONSTRAINT vps_instances_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.vps_packages(id);


--
-- Name: vps_instances vps_instances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.vps_instances
    ADD CONSTRAINT vps_instances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

