import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Modal,
  Select,
  Input,
  List,
  message,
  Tabs,
  Descriptions,
  Timeline,
  Tooltip,
  Upload,
  Form,
  Popconfirm,
} from 'antd';
import {
  FolderOpenOutlined,
  VideoCameraOutlined,
  PictureOutlined,
  FilePptOutlined,
  AppstoreOutlined,
  SearchOutlined,
  EyeOutlined,
  UploadOutlined,
  HistoryOutlined,
  CheckOutlined,
  RollbackOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import type { ContentItem, ContentVersion } from '@/types';
import dayjs from 'dayjs';

const { TextArea } = Input;

const typeIcons: Record<string, React.ReactNode> = {
  video: <VideoCameraOutlined />,
  image: <PictureOutlined />,
  ppt: <FilePptOutlined />,
  interactive: <AppstoreOutlined />,
};

const typeNames: Record<string, string> = {
  video: '视频',
  image: '图片',
  ppt: 'PPT',
  interactive: '互动程序',
};

const typeColors: Record<string, string> = {
  video: 'blue',
  image: 'green',
  ppt: 'orange',
  interactive: 'purple',
};

const statusColors: Record<string, string> = {
  published: 'green',
  draft: 'orange',
  archived: 'default',
  pending_review: 'gold',
};

const statusNames: Record<string, string> = {
  published: '已上架',
  draft: '草稿',
  archived: '已归档',
  pending_review: '待审核',
};

const reviewStatusNames: Record<string, string> = {
  pending: '待审核',
  approved: '审核通过',
  rejected: '审核驳回',
};

const reviewStatusColors: Record<string, string> = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
};

const typeThumbnails: Record<string, string> = {
  video: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20video%20player%20interface%20dark%20theme&image_size=square',
  image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20gallery%20image%20frame%20artistic&image_size=square',
  ppt: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20presentation%20slide%20professional&image_size=square',
  interactive: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20interactive%20touch%20interface%20futuristic&image_size=square',
};

export default function ContentLibrary() {
  const {
    contents,
    publishContent,
    rollbackContent,
    addContent,
    submitContentReview,
    approveContent,
    rejectContent,
  } = useAppStore();
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [versionVisible, setVersionVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewType, setReviewType] = useState<'approve' | 'reject'>('approve');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [uploadForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const filteredContents = contents.filter((c) => {
    const matchType = filterType === 'all' || c.type === filterType;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchSearch = !searchText || c.name.includes(searchText) || c.description.includes(searchText);
    return matchType && matchStatus && matchSearch;
  });

  const getCurrentContent = (id: string) => contents.find((c) => c.id === id) || null;

  const handlePreview = (content: ContentItem) => {
    setSelectedContent(content);
    setPreviewVisible(true);
  };

  const handleViewVersions = (content: ContentItem) => {
    setSelectedContent(content);
    setVersionVisible(true);
  };

  const handlePublish = (contentId: string) => {
    publishContent(contentId);
    message.success('素材已上架');
    const updated = getCurrentContent(contentId);
    if (updated && selectedContent?.id === contentId) {
      setSelectedContent(updated);
    }
  };

  const handleRollback = (version: string) => {
    if (selectedContent) {
      rollbackContent(selectedContent.id, version);
      message.success('已回退到版本 ' + version);
      setVersionVisible(false);
      const updated = getCurrentContent(selectedContent.id);
      if (updated) {
        setSelectedContent(updated);
      }
    }
  };

  const handleSubmitReview = (contentId: string) => {
    submitContentReview(contentId);
    message.success('已提交审核');
    const updated = getCurrentContent(contentId);
    if (updated && selectedContent?.id === contentId) {
      setSelectedContent(updated);
    }
  };

  const handleOpenReview = (type: 'approve' | 'reject') => {
    setReviewType(type);
    reviewForm.resetFields();
    setReviewVisible(true);
  };

  const handleSaveReview = async () => {
    if (!selectedContent) return;
    try {
      const values = await reviewForm.validateFields();

      if (reviewType === 'approve') {
        approveContent(selectedContent.id, values.note);
        message.success('审核通过');
      } else {
        rejectContent(selectedContent.id, values.note);
        message.success('已驳回');
      }

      setReviewVisible(false);
      const updated = getCurrentContent(selectedContent.id);
      if (updated) {
        setSelectedContent(updated);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleUpload = () => {
    uploadForm.resetFields();
    uploadForm.setFieldsValue({
      type: 'video',
      description: '',
    });
    setUploadVisible(true);
  };

  const handleSaveUpload = async () => {
    try {
      const values = await uploadForm.validateFields();

      const newVersion: ContentVersion = {
        version: '1.0',
        uploader: '当前值班员',
        uploadTime: dayjs().format('YYYY-MM-DD HH:mm'),
        size: Math.floor(Math.random() * 50 + 10) + 'MB',
        note: '初始版本',
      };

      const newContent = {
        name: values.name,
        type: values.type,
        description: values.description || '',
        thumbnail: typeThumbnails[values.type],
        version: '1.0',
        status: 'draft' as const,
        size: newVersion.size,
        uploader: newVersion.uploader,
        note: '初始版本',
      };

      addContent(newContent);
      message.success('素材上传成功');
      setUploadVisible(false);
      uploadForm.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const renderVersionItem = (v: ContentVersion, isCurrent: boolean) => (
    <div style={{ paddingBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <Space>
          <span style={{ fontWeight: 'bold' }}>{v.version}</span>
          {isCurrent && <Tag color="green" icon={<CheckOutlined />}>当前版本</Tag>}
          {v.reviewStatus && (
            <Tag color={reviewStatusColors[v.reviewStatus]} icon={
              v.reviewStatus === 'approved' ? <CheckCircleOutlined /> :
              v.reviewStatus === 'rejected' ? <CloseCircleOutlined /> :
              <ClockCircleOutlined />
            }>
              {reviewStatusNames[v.reviewStatus]}
            </Tag>
          )}
        </Space>
        {!isCurrent && (
          <Button
            size="small"
            icon={<RollbackOutlined />}
            onClick={() => handleRollback(v.version)}
          >
            回退到此版本
          </Button>
        )}
      </div>
      <div style={{ color: '#666', fontSize: 13, marginBottom: 4 }}>{v.note}</div>
      <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>
        {v.uploader} · {v.uploadTime} · {v.size}
      </div>
      {v.reviewStatus && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            background: v.reviewStatus === 'rejected' ? '#fff1f0' : '#f6ffed',
            borderRadius: 4,
            fontSize: 12,
            color: '#666',
          }}
        >
          <div style={{ marginBottom: 2 }}>
            <span style={{ fontWeight: 'bold' }}>审核信息</span>
          </div>
          <div>审核人: {v.reviewer || '-'}</div>
          <div>审核时间: {v.reviewTime || '-'}</div>
          <div>审核备注: {v.reviewNote || '-'}</div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
      <Card
        title={
          <Space>
            <FolderOpenOutlined />
            内容库
            <Tag color="blue">{contents.length} 个素材</Tag>
          </Space>
        }
        extra={
          <Space>
            <Input
              placeholder="搜索素材..."
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              defaultValue="all"
              size="small"
              style={{ width: 100 }}
              onChange={setFilterType}
              options={[
                { value: 'all', label: '全部类型' },
                { value: 'video', label: '视频' },
                { value: 'image', label: '图片' },
                { value: 'ppt', label: 'PPT' },
                { value: 'interactive', label: '互动' },
              ]}
            />
            <Select
              defaultValue="all"
              size="small"
              style={{ width: 110 }}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: '全部状态' },
                { value: 'published', label: '已上架' },
                { value: 'pending_review', label: '待审核' },
                { value: 'draft', label: '草稿' },
                { value: 'archived', label: '已归档' },
              ]}
            />
            <Button type="primary" icon={<UploadOutlined />} size="small" onClick={handleUpload}>
              上传素材
            </Button>
          </Space>
        }
      >
        <Row gutter={[16, 16]}>
          {filteredContents.map((content) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={content.id}>
              <Card
                hoverable
                size="small"
                bodyStyle={{ padding: 0 }}
                onClick={() => handlePreview(content)}
              >
                <div
                  style={{
                    position: 'relative',
                    height: 120,
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={content.thumbnail}
                    alt={content.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: 8, left: 8 }}>
                    <Tag color={typeColors[content.type]} icon={typeIcons[content.type]}>
                      {typeNames[content.type]}
                    </Tag>
                  </div>
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <Tag color={statusColors[content.status]}>
                      {statusNames[content.status]}
                    </Tag>
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      padding: '4px 8px',
                      fontSize: 12,
                    }}
                  >
                    <Space size="small">
                      <span>{content.version}</span>
                      <span>·</span>
                      <span>{content.size}</span>
                    </Space>
                  </div>
                </div>
                <div style={{ padding: 12 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      marginBottom: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {content.name}
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>
                    {content.description}
                  </div>
                  <Space size="small" wrap>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(content);
                      }}
                    >
                      预览
                    </Button>
                    <Button
                      size="small"
                      icon={<HistoryOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewVersions(content);
                      }}
                    >
                      版本
                    </Button>
                    {content.status === 'draft' && (
                      <Button
                        size="small"
                        icon={<ClockCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubmitReview(content.id);
                        }}
                      >
                        提交审核
                      </Button>
                    )}
                    {content.status === 'draft' && (
                      <Button
                        size="small"
                        type="primary"
                        icon={<ArrowUpOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePublish(content.id);
                        }}
                      >
                        上架
                      </Button>
                    )}
                    {content.status === 'pending_review' && (
                      <Button
                        size="small"
                        type="primary"
                        danger
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContent(content);
                          handleOpenReview('approve');
                        }}
                      >
                        审核
                      </Button>
                    )}
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
          {filteredContents.length === 0 && (
            <Col span={24}>
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                <FolderOpenOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                <div>暂无符合条件的素材</div>
              </div>
            </Col>
          )}
        </Row>
      </Card>

      <Modal
        title={
          <Space>
            {selectedContent && typeIcons[selectedContent.type]}
            {selectedContent?.name}
          </Space>
        }
        open={previewVisible}
        onCancel={() => {
          setPreviewVisible(false);
          setSelectedContent(null);
        }}
        footer={null}
        width={800}
        maskClosable={false}
      >
        {selectedContent && (
          <div>
            <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
              <img
                src={selectedContent.thumbnail}
                alt={selectedContent.name}
                style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }}
              />
            </div>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="素材类型">{typeNames[selectedContent.type]}</Descriptions.Item>
              <Descriptions.Item label="当前版本">{selectedContent.version}</Descriptions.Item>
              <Descriptions.Item label="文件大小">{selectedContent.size}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[selectedContent.status]}>
                  {statusNames[selectedContent.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="上传时间">{selectedContent.uploadTime}</Descriptions.Item>
              <Descriptions.Item label="上传者">{selectedContent.uploader}</Descriptions.Item>
              {selectedContent.duration && (
                <Descriptions.Item label="时长">
                  {Math.floor(selectedContent.duration / 60)}分{selectedContent.duration % 60}秒
                </Descriptions.Item>
              )}
              <Descriptions.Item label="版本数">{selectedContent.versions.length} 个</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{selectedContent.description}</Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space wrap>
                <Button
                  icon={<HistoryOutlined />}
                  onClick={() => {
                    const current = getCurrentContent(selectedContent.id);
                    if (current) {
                      setSelectedContent(current);
                    }
                    setPreviewVisible(false);
                    setVersionVisible(true);
                  }}
                >
                  查看版本
                </Button>
                {selectedContent.status === 'draft' && (
                  <Button
                    icon={<ClockCircleOutlined />}
                    onClick={() => {
                      handleSubmitReview(selectedContent.id);
                      const updated = getCurrentContent(selectedContent.id);
                      if (updated) {
                        setSelectedContent(updated);
                      }
                    }}
                  >
                    提交审核
                  </Button>
                )}
                {selectedContent.status === 'draft' && (
                  <Button type="primary" icon={<ArrowUpOutlined />} onClick={() => {
                    handlePublish(selectedContent.id);
                  }}>
                    立即上架
                  </Button>
                )}
                {selectedContent.status === 'pending_review' && (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleOpenReview('approve')}
                  >
                    审核通过
                  </Button>
                )}
                {selectedContent.status === 'pending_review' && (
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleOpenReview('reject')}
                  >
                    审核驳回
                  </Button>
                )}
              </Space>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="版本历史"
        open={versionVisible}
        onCancel={() => {
          setVersionVisible(false);
          setSelectedContent(null);
        }}
        footer={null}
        width={650}
        maskClosable={false}
      >
        {selectedContent && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontWeight: 'bold' }}>{selectedContent.name}</span>
              <Tag color="blue" style={{ marginLeft: 8 }}>当前: {selectedContent.version}</Tag>
            </div>
            <Timeline
              items={selectedContent.versions.map((v) => ({
                color: v.version === selectedContent.version ? 'green' : 'blue',
                children: renderVersionItem(v, v.version === selectedContent.version),
              }))}
            />
          </div>
        )}
      </Modal>

      <Modal
        title={reviewType === 'approve' ? '审核通过' : '审核驳回'}
        open={reviewVisible}
        onCancel={() => setReviewVisible(false)}
        onOk={handleSaveReview}
        okText={reviewType === 'approve' ? '通过' : '驳回'}
        okButtonProps={{ danger: reviewType === 'reject' }}
        cancelText="取消"
        width={450}
        maskClosable={false}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            label="审核备注"
            name="note"
            rules={reviewType === 'reject' ? [{ required: true, message: '请输入驳回原因' }] : []}
          >
            <TextArea
              rows={4}
              placeholder={reviewType === 'approve' ? '请输入审核备注（可选）' : '请输入驳回原因'}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上传素材"
        open={uploadVisible}
        onCancel={() => {
          setUploadVisible(false);
          uploadForm.resetFields();
        }}
        onOk={handleSaveUpload}
        okText="上传"
        cancelText="取消"
        width={500}
        maskClosable={false}
        destroyOnClose
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item
            label="素材名称"
            name="name"
            rules={[{ required: true, message: '请输入素材名称' }]}
          >
            <Input placeholder="请输入素材名称" />
          </Form.Item>
          <Form.Item
            label="素材类型"
            name="type"
            rules={[{ required: true, message: '请选择素材类型' }]}
          >
            <Select
              placeholder="请选择素材类型"
              options={[
                { value: 'video', label: '视频' },
                { value: 'image', label: '图片' },
                { value: 'ppt', label: 'PPT' },
                { value: 'interactive', label: '互动程序' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="上传文件"
            name="file"
            rules={[{ required: true, message: '请选择上传文件' }]}
          >
            <Upload.Dragger
              beforeUpload={() => false}
              maxCount={1}
              onChange={(info) => {
                if (info.fileList.length > 0) {
                  uploadForm.setFieldsValue({ file: info.fileList[0].name });
                }
              }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint">支持单个文件上传</p>
            </Upload.Dragger>
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea rows={3} placeholder="请输入素材描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
